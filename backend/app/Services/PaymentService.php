<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Property;
use App\Models\SubscriptionPlan;
use Stripe\StripeClient;
use Stripe\Exception\ApiErrorException;
use Illuminate\Support\Facades\Log;

class PaymentService
{
    protected StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('services.stripe.secret'));
    }

    /**
     * Create a Stripe payment intent.
     */
    public function createPaymentIntent(float $amount, string $currency = 'usd', array $metadata = []): array
    {
        try {
            $paymentIntent = $this->stripe->paymentIntents->create([
                'amount' => (int) ($amount * 100), // Convert to cents
                'currency' => strtolower($currency),
                'metadata' => $metadata,
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
            ]);

            return [
                'success' => true,
                'client_secret' => $paymentIntent->client_secret,
                'payment_intent_id' => $paymentIntent->id,
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe payment intent creation failed', [
                'error' => $e->getMessage(),
                'amount' => $amount,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Confirm a payment.
     */
    public function confirmPayment(string $paymentIntentId): array
    {
        try {
            $paymentIntent = $this->stripe->paymentIntents->retrieve($paymentIntentId);

            return [
                'success' => true,
                'payment_intent' => $paymentIntent,
                'status' => $paymentIntent->status,
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe payment confirmation failed', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Process a refund.
     */
    public function refundPayment(string $paymentIntentId, ?float $amount = null): array
    {
        try {
            $params = ['payment_intent' => $paymentIntentId];
            if ($amount !== null) {
                $params['amount'] = (int) ($amount * 100);
            }

            $refund = $this->stripe->refunds->create($params);

            return [
                'success' => true,
                'refund' => $refund,
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe refund failed', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Create a Stripe subscription.
     */
    public function createSubscription(string $customerId, string $priceId, array $metadata = []): array
    {
        try {
            $subscription = $this->stripe->subscriptions->create([
                'customer' => $customerId,
                'items' => [
                    ['price' => $priceId],
                ],
                'metadata' => $metadata,
            ]);

            return [
                'success' => true,
                'subscription' => $subscription,
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe subscription creation failed', [
                'error' => $e->getMessage(),
                'customer_id' => $customerId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Cancel a subscription.
     */
    public function cancelSubscription(string $subscriptionId, bool $immediately = false): array
    {
        try {
            if ($immediately) {
                $subscription = $this->stripe->subscriptions->cancel($subscriptionId);
            } else {
                $subscription = $this->stripe->subscriptions->update($subscriptionId, [
                    'cancel_at_period_end' => true,
                ]);
            }

            return [
                'success' => true,
                'subscription' => $subscription,
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe subscription cancellation failed', [
                'error' => $e->getMessage(),
                'subscription_id' => $subscriptionId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get or create Stripe customer.
     */
    public function getOrCreateCustomer(int $userId, string $email, string $name): array
    {
        try {
            // Check if customer already exists
            $customers = $this->stripe->customers->all([
                'email' => $email,
                'limit' => 1,
            ]);

            if (count($customers->data) > 0) {
                return [
                    'success' => true,
                    'customer_id' => $customers->data[0]->id,
                ];
            }

            // Create new customer
            $customer = $this->stripe->customers->create([
                'email' => $email,
                'name' => $name,
                'metadata' => [
                    'user_id' => $userId,
                ],
            ]);

            return [
                'success' => true,
                'customer_id' => $customer->id,
            ];
        } catch (ApiErrorException $e) {
            Log::error('Stripe customer creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $userId,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get plan price ID from plan name.
     */
    public function getPlanPriceId(string $plan): ?string
    {
        return SubscriptionPlan::where('slug', $plan)
            ->where('is_active', true)
            ->value('stripe_price_id');
    }

    /**
     * Get plan amount.
     */
    public function getPlanAmount(string $plan): float
    {
        return (float) (SubscriptionPlan::where('slug', $plan)
            ->where('is_active', true)
            ->value('price') ?? 0);
    }
}
