<?php

namespace App\Services;

use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class SubscriptionLimitService
{
    /**
     * Get the subscription plan for the user (or null if no active subscription).
     */
    public function getPlanForUser(User $user): ?SubscriptionPlan
    {
        if (! $user->subscribed('default')) {
            return null;
        }

        $sub = $user->subscription('default');
        $cacheKey = "subscription_plan:{$user->id}";

        return Cache::remember($cacheKey, 300, function () use ($sub) {
            return SubscriptionPlan::where('stripe_price_id', $sub->stripe_price)->first();
        });
    }

    /**
     * Check if the user can add a new listing.
     * Admins bypass limits. Non-agents without subscription cannot add.
     */
    public function canAddListing(User $user): array
    {
        if ($user->isAdmin()) {
            return ['allowed' => true, 'reason' => null];
        }

        if (! $user->isAgent()) {
            return ['allowed' => false, 'reason' => 'Only agents can add listings.'];
        }

        if (! $user->subscribed('default')) {
            return [
                'allowed' => false,
                'reason' => 'An active subscription is required to add listings. Please subscribe to a plan.',
            ];
        }

        $plan = $this->getPlanForUser($user);
        if (! $plan) {
            return ['allowed' => false, 'reason' => 'Unable to determine subscription plan.'];
        }

        // 0 = unlimited
        if ($plan->max_listings === 0) {
            return ['allowed' => true, 'reason' => null];
        }

        $activeCount = $user->properties()
            ->where('status', '!=', 'sold')
            ->where('status', '!=', 'off_market')
            ->count();

        if ($activeCount >= $plan->max_listings) {
            return [
                'allowed' => false,
                'reason' => "Your {$plan->name} plan allows up to {$plan->max_listings} active listings. You have reached this limit. Upgrade to add more.",
                'current' => $activeCount,
                'max' => $plan->max_listings,
            ];
        }

        return ['allowed' => true, 'reason' => null];
    }

    /**
     * Check if the user can feature a property.
     */
    public function canFeatureListing(User $user): array
    {
        if ($user->isAdmin()) {
            return ['allowed' => true, 'reason' => null];
        }

        if (! $user->isAgent()) {
            return ['allowed' => false, 'reason' => 'Only agents can feature listings.'];
        }

        if (! $user->subscribed('default')) {
            return [
                'allowed' => false,
                'reason' => 'An active subscription is required to feature listings.',
            ];
        }

        $plan = $this->getPlanForUser($user);
        if (! $plan) {
            return ['allowed' => false, 'reason' => 'Unable to determine subscription plan.'];
        }

        // 0 = unlimited featured
        if ($plan->max_featured_listings === 0) {
            return ['allowed' => true, 'reason' => null];
        }

        $featuredCount = $user->properties()->where('is_featured', true)->count();

        if ($featuredCount >= $plan->max_featured_listings) {
            return [
                'allowed' => false,
                'reason' => "Your {$plan->name} plan allows up to {$plan->max_featured_listings} featured listings. Upgrade for more.",
                'current' => $featuredCount,
                'max' => $plan->max_featured_listings,
            ];
        }

        return ['allowed' => true, 'reason' => null];
    }

    /**
     * Check if the user has access to advanced analytics.
     */
    public function hasAdvancedAnalytics(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $plan = $this->getPlanForUser($user);

        return $plan && $plan->analytics_advanced;
    }

    /**
     * Check if the user has API access.
     */
    public function hasApiAccess(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $plan = $this->getPlanForUser($user);

        return $plan && $plan->api_access;
    }

    /**
     * Get limits summary for the user (for frontend display).
     */
    public function getLimitsForUser(User $user): array
    {
        $plan = $this->getPlanForUser($user);

        if (! $plan) {
            return [
                'has_subscription' => false,
                'plan_slug' => null,
                'plan_name' => null,
                'max_listings' => 0,
                'current_listings' => 0,
                'can_add_listing' => false,
                'max_featured_listings' => 0,
                'current_featured_listings' => 0,
                'can_feature_listing' => false,
                'analytics_advanced' => false,
                'api_access' => false,
            ];
        }

        $activeListings = $user->properties()
            ->where('status', '!=', 'sold')
            ->where('status', '!=', 'off_market')
            ->count();

        $featuredListings = $user->properties()->where('is_featured', true)->count();

        $canAdd = $plan->max_listings === 0 || $activeListings < $plan->max_listings;
        $canFeature = $plan->max_featured_listings === 0 || $featuredListings < $plan->max_featured_listings;

        return [
            'has_subscription' => true,
            'plan_slug' => $plan->slug,
            'plan_name' => $plan->name,
            'max_listings' => $plan->max_listings,
            'current_listings' => $activeListings,
            'can_add_listing' => $canAdd,
            'listings_remaining' => $plan->max_listings === 0 ? null : max(0, $plan->max_listings - $activeListings),
            'max_featured_listings' => $plan->max_featured_listings,
            'current_featured_listings' => $featuredListings,
            'can_feature_listing' => $canFeature,
            'featured_remaining' => $plan->max_featured_listings === 0 ? null : max(0, $plan->max_featured_listings - $featuredListings),
            'analytics_advanced' => $plan->analytics_advanced,
            'api_access' => $plan->api_access,
        ];
    }

    /**
     * Clear cached plan for user (e.g. after subscription change).
     */
    public function clearCacheForUser(User $user): void
    {
        Cache::forget("subscription_plan:{$user->id}");
    }
}
