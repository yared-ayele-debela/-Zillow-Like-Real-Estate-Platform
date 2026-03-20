<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeaturedListingPackage;
use App\Models\Payment;
use App\Models\Property;
use App\Services\PaymentService;
use App\Services\SubscriptionLimitService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected PaymentService $paymentService;

    protected SubscriptionLimitService $subscriptionLimitService;

    public function __construct(PaymentService $paymentService, SubscriptionLimitService $subscriptionLimitService)
    {
        $this->paymentService = $paymentService;
        $this->subscriptionLimitService = $subscriptionLimitService;
    }

    /**
     * Create a payment.
     */
    public function createPayment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:featured_listing,subscription',
            'property_id' => 'required_if:type,featured_listing|exists:properties,id',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'sometimes|string|size:3',
            'duration_days' => 'sometimes|integer|min:1|max:365', // For featured listings
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        DB::beginTransaction();
        try {
            // Create payment record
            $payment = Payment::create([
                'user_id' => $user->id,
                'property_id' => $request->property_id ?? null,
                'type' => $request->type,
                'amount' => $request->amount,
                'currency' => $request->currency ?? 'USD',
                'status' => 'pending',
                'metadata' => [
                    'duration_days' => $request->duration_days ?? 30,
                    'package_id' => $request->package_id,
                ],
            ]);

            // Get or create Stripe customer
            $customerResult = $this->paymentService->getOrCreateCustomer(
                $user->id,
                $user->email,
                $user->name
            );

            if (!$customerResult['success']) {
                throw new \Exception('Failed to create customer: ' . $customerResult['error']);
            }

            // Create payment intent
            $paymentIntentResult = $this->paymentService->createPaymentIntent(
                $request->amount,
                strtolower($request->currency ?? 'usd'),
                [
                    'payment_id' => $payment->id,
                    'user_id' => $user->id,
                    'type' => $request->type,
                ]
            );

            if (!$paymentIntentResult['success']) {
                throw new \Exception('Failed to create payment intent: ' . $paymentIntentResult['error']);
            }

            // Update payment with Stripe payment intent ID
            $payment->update([
                'stripe_payment_intent_id' => $paymentIntentResult['payment_intent_id'],
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Payment created successfully',
                'payment' => $payment,
                'client_secret' => $paymentIntentResult['client_secret'],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Failed to create payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Confirm a payment.
     */
    public function confirmPayment(Request $request, string $id)
    {
        $user = $request->user();
        $payment = Payment::findOrFail($id);

        // Check ownership
        if ($payment->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        DB::beginTransaction();
        try {
            // Verify payment with Stripe
            $confirmResult = $this->paymentService->confirmPayment($payment->stripe_payment_intent_id);

            if (!$confirmResult['success']) {
                throw new \Exception('Payment verification failed: ' . $confirmResult['error']);
            }

            $paymentIntent = $confirmResult['payment_intent'];

            // Update payment status
            if ($paymentIntent->status === 'succeeded') {
                $payment->update([
                    'status' => 'completed',
                    'transaction_id' => $paymentIntent->id,
                ]);

                // Process based on payment type
                if ($payment->type === 'featured_listing' && $payment->property_id) {
                    $this->processFeaturedListing($payment);
                }

                DB::commit();

                // TODO: Send confirmation email

                return response()->json([
                    'message' => 'Payment confirmed successfully',
                    'payment' => $payment->fresh(),
                ]);
            } else {
                $payment->update([
                    'status' => 'failed',
                ]);

                DB::commit();

                return response()->json([
                    'message' => 'Payment not completed',
                    'status' => $paymentIntent->status,
                ], 400);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment confirmation failed', [
                'error' => $e->getMessage(),
                'payment_id' => $payment->id,
            ]);

            return response()->json([
                'message' => 'Failed to confirm payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment history.
     */
    public function paymentHistory(Request $request)
    {
        $user = $request->user();

        $payments = Payment::where('user_id', $user->id)
            ->with(['property:id,title,address'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($payments);
    }

    /**
     * Process featured listing payment.
     */
    protected function processFeaturedListing(Payment $payment): void
    {
        $property = Property::find($payment->property_id);
        if (!$property) {
            return;
        }

        $durationDays = $payment->metadata['duration_days'] ?? 30;
        $featuredUntil = now()->addDays($durationDays);

        // Mark property as featured
        $property->update([
            'is_featured' => true,
        ]);

        // Store featured expiration in metadata (you might want a separate table for this)
        $propertyMetadata = $property->metadata ?? [];
        $propertyMetadata['featured_until'] = $featuredUntil->toIso8601String();
        $propertyMetadata['featured_payment_id'] = $payment->id;

        // Note: If you add a metadata column to properties table, update it here
        // For now, we'll just mark it as featured
    }

    /**
     * Request a refund.
     */
    public function requestRefund(Request $request, string $id)
    {
        $user = $request->user();
        $payment = Payment::findOrFail($id);

        // Check ownership
        if ($payment->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Only completed payments can be refunded
        if ($payment->status !== 'completed') {
            return response()->json([
                'message' => 'Only completed payments can be refunded',
            ], 400);
        }

        try {
            $refundResult = $this->paymentService->refundPayment($payment->stripe_payment_intent_id);

            if (!$refundResult['success']) {
                throw new \Exception('Refund failed: ' . $refundResult['error']);
            }

            $payment->update([
                'status' => 'refunded',
            ]);

            // If it was a featured listing, remove featured status
            if ($payment->type === 'featured_listing' && $payment->property_id) {
                $property = Property::find($payment->property_id);
                if ($property) {
                    $property->update(['is_featured' => false]);
                }
            }

            return response()->json([
                'message' => 'Refund processed successfully',
                'payment' => $payment->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Refund failed', [
                'error' => $e->getMessage(),
                'payment_id' => $payment->id,
            ]);

            return response()->json([
                'message' => 'Failed to process refund',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Feature a property (creates payment).
     */
    public function featureProperty(Request $request, string $propertyId)
    {
        $validator = Validator::make($request->all(), [
            'package_id' => 'required|exists:featured_listing_packages,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $property = Property::findByIdOrUuidOrFail($propertyId);

        // Check ownership
        if ($property->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $package = FeaturedListingPackage::where('id', $request->package_id)
            ->where('is_active', true)
            ->first();

        if (!$package) {
            return response()->json([
                'message' => 'Selected featured package is not active',
            ], 422);
        }

        // Check subscription limit for featured listings
        if ($user->isAgent() && ! $user->isAdmin()) {
            $check = $this->subscriptionLimitService->canFeatureListing($user);
            if (! $check['allowed']) {
                return response()->json([
                    'message' => $check['reason'],
                    'limit_reached' => true,
                    'current' => $check['current'] ?? null,
                    'max' => $check['max'] ?? null,
                ], 403);
            }
        }

        // Create payment
        return $this->createPayment($request->merge([
            'type' => 'featured_listing',
            'property_id' => $propertyId,
            'amount' => $package->price,
            'duration_days' => $package->duration_days,
            'currency' => $package->currency,
            'package_id' => $package->id,
        ]));
    }
}
