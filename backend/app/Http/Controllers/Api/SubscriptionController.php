<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

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
