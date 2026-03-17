<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Laravel\Cashier\Cashier;
use Stripe\Stripe;

class SubscriptionController extends Controller
{
    /**
     * Create a subscription checkout session (Laravel Cashier).
     * Returns Stripe Checkout URL for the frontend to redirect the agent.
     */
    public function createSubscription(Request $request)
    {
        $request->validate([
            'plan' => 'required|string|exists:subscription_plans,slug',
        ]);

        $user = $request->user();

        if (! $user->isAgent()) {
            throw ValidationException::withMessages([
                'plan' => ['Only agents can subscribe to a plan.'],
            ]);
        }

        $plan = SubscriptionPlan::where('slug', $request->plan)
            ->where('is_active', true)
            ->firstOrFail();

        $priceId = $plan->stripe_price_id;
        if (! $priceId) {
            return response()->json([
                'message' => 'This plan is not configured for Stripe. Please set stripe_price_id in Stripe and in subscription_plans.',
            ], 422);
        }

        if ($user->subscribed('default')) {
            return response()->json([
                'message' => 'You already have an active subscription.',
                'subscription' => $this->formatSubscriptionForApi($user),
            ], 400);
        }

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');

        try {
            $checkout = $user->newSubscription('default', $priceId)
                ->checkout([
                    'success_url' => $frontendUrl.'/subscription?success=1&session_id={CHECKOUT_SESSION_ID}',
                    'cancel_url' => $frontendUrl.'/subscription?cancel=1',
                ]);

            return response()->json([
                'message' => 'Redirect to checkout.',
                'url' => $checkout->url,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Subscription checkout failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Failed to create checkout session.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Confirm checkout and sync subscription from Stripe.
     * Called when user returns from Stripe Checkout with session_id.
     * Needed for local dev where webhooks cannot reach localhost.
     */
    public function confirmCheckout(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
        ]);

        $user = $request->user();

        if (! $user->isAgent()) {
            throw ValidationException::withMessages([
                'session_id' => ['Only agents can confirm subscription checkout.'],
            ]);
        }

        try {
            Stripe::setApiKey(config('services.stripe.secret'));
            $stripe = Cashier::stripe();

            $session = $stripe->checkout->sessions->retrieve(
                $request->session_id,
                ['expand' => ['subscription', 'subscription.items.data.price']]
            );

            if (! $session->subscription) {
                return response()->json([
                    'message' => 'No subscription found in checkout session.',
                ], 400);
            }

            $customerId = is_string($session->customer) ? $session->customer : $session->customer->id;
            if ($user->stripe_id !== $customerId) {
                return response()->json([
                    'message' => 'Checkout session does not belong to this user.',
                ], 403);
            }

            $stripeSubscription = $session->subscription;
            if (is_string($stripeSubscription)) {
                $stripeSubscription = $stripe->subscriptions->retrieve(
                    $stripeSubscription,
                    ['expand' => ['items.data.price']]
                );
            }

            $data = [
                'id' => $stripeSubscription->id,
                'customer' => $stripeSubscription->customer,
                'status' => $stripeSubscription->status,
                'metadata' => $stripeSubscription->metadata ?? [],
                'trial_end' => $stripeSubscription->trial_end ?? null,
                'cancel_at_period_end' => $stripeSubscription->cancel_at_period_end ?? false,
                'cancel_at' => $stripeSubscription->cancel_at ?? null,
                'canceled_at' => $stripeSubscription->canceled_at ?? null,
                'items' => [
                    'data' => array_map(function ($item) {
                        return [
                            'id' => $item->id,
                            'price' => [
                                'id' => $item->price->id,
                                'product' => $item->price->product,
                            ],
                            'quantity' => $item->quantity ?? null,
                        ];
                    }, $stripeSubscription->items->data ?? []),
                ],
            ];

            $this->syncSubscriptionFromStripe($user, $data);

            return response()->json([
                'message' => 'Subscription confirmed.',
                'subscription' => $this->formatSubscriptionForApi($user),
            ]);
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            Log::warning('Confirm checkout failed: invalid session', [
                'error' => $e->getMessage(),
                'session_id' => $request->session_id,
            ]);

            return response()->json([
                'message' => 'Invalid checkout session.',
                'error' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Confirm checkout failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Failed to confirm checkout.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync subscription from Stripe data (same structure as webhook payload).
     */
    protected function syncSubscriptionFromStripe(User $user, array $data): void
    {
        if (! $user->subscriptions->contains('stripe_id', $data['id'])) {
            $trialEndsAt = isset($data['trial_end'])
                ? Carbon::createFromTimestamp($data['trial_end'])
                : null;

            $firstItem = $data['items']['data'][0] ?? null;
            $isSinglePrice = $firstItem && count($data['items']['data']) === 1;

            $user->subscriptions()->updateOrCreate(
                ['stripe_id' => $data['id']],
                [
                    'type' => $data['metadata']['type'] ?? $data['metadata']['name'] ?? 'default',
                    'stripe_status' => $data['status'],
                    'stripe_price' => $isSinglePrice ? $firstItem['price']['id'] : null,
                    'quantity' => $isSinglePrice && isset($firstItem['quantity']) ? $firstItem['quantity'] : null,
                    'trial_ends_at' => $trialEndsAt,
                    'ends_at' => null,
                ]
            );

            $subscription = $user->subscriptions()->where('stripe_id', $data['id'])->first();
            foreach ($data['items']['data'] as $item) {
                $subscription->items()->updateOrCreate(
                    ['stripe_id' => $item['id']],
                    [
                        'stripe_product' => $item['price']['product'],
                        'stripe_price' => $item['price']['id'],
                        'quantity' => $item['quantity'] ?? null,
                    ]
                );
            }
        }
    }

    /**
     * Cancel the current subscription at period end (Laravel Cashier).
     */
    public function cancelSubscription(Request $request, string $id)
    {
        $user = $request->user();

        if (! $user->subscribed('default')) {
            return response()->json([
                'message' => 'No active subscription found.',
            ], 404);
        }

        $subscription = $user->subscription('default');
        if ((string) $subscription->id !== (string) $id && ! $user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        try {
            $subscription->cancel();

            return response()->json([
                'message' => 'Subscription will be cancelled at the end of the billing period.',
                'subscription' => $this->formatSubscriptionForApi($user),
            ]);
        } catch (\Exception $e) {
            Log::error('Subscription cancellation failed', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Failed to cancel subscription.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get current subscription (Laravel Cashier).
     */
    public function getCurrentSubscription(Request $request)
    {
        $user = $request->user();
        $subscription = $this->formatSubscriptionForApi($user);

        return response()->json([
            'subscription' => $subscription,
            'has_active_subscription' => $user->subscribed('default'),
        ]);
    }

    /**
     * Check subscription status (Laravel Cashier).
     */
    public function checkSubscription(Request $request)
    {
        $user = $request->user();

        if (! $user->subscribed('default')) {
            return response()->json([
                'has_subscription' => false,
                'is_active' => false,
            ]);
        }

        $subscription = $user->subscription('default');
        $formatted = $this->formatSubscriptionForApi($user);

        return response()->json([
            'has_subscription' => true,
            'is_active' => $subscription->active(),
            'subscription' => $formatted,
            'days_remaining' => $subscription->ends_at ? max(0, now()->diffInDays($subscription->ends_at, false)) : null,
        ]);
    }

    /**
     * Format Cashier subscription for API (plan slug, status, ends_at).
     */
    protected function formatSubscriptionForApi($user): ?array
    {
        if (! $user->subscribed('default')) {
            return null;
        }

        $subscription = $user->subscription('default');
        $plan = SubscriptionPlan::where('stripe_price_id', $subscription->stripe_price)->first();

        return [
            'id' => $subscription->id,
            'plan' => $plan ? $plan->slug : 'default',
            'status' => $subscription->stripe_status,
            'stripe_status' => $subscription->stripe_status,
            'ends_at' => $subscription->ends_at?->toIso8601String(),
            'cancel_at_period_end' => $subscription->cancel_at_period_end ?? false,
        ];
    }
}
