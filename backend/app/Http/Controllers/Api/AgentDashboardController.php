<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Message;
use App\Models\SubscriptionPlan;
use App\Services\SubscriptionLimitService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgentDashboardController extends Controller
{
    /**
     * Get agent dashboard data.
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();

        // Only agents and admins can access dashboard
        if (!$user->isAgent() && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Only agents can access this dashboard.',
            ], 403);
        }

        // Get agent's properties
        $properties = Property::where('user_id', $user->id)
            ->with(['images', 'amenities'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Calculate statistics
        $totalProperties = Property::where('user_id', $user->id)->count();
        $activeListings = Property::where('user_id', $user->id)
            ->where('status', '!=', 'sold')
            ->where('is_approved', true)
            ->count();

        $totalViews = Property::where('user_id', $user->id)->sum('views');
        $totalSaves = Property::where('user_id', $user->id)->sum('saves');

        // Get inquiries (messages received for agent's properties)
        $totalInquiries = Message::whereHas('property', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->orWhere('receiver_id', $user->id)
            ->where('type', 'inquiry')
            ->count();

        // Get recent messages
        $recentMessages = Message::whereHas('property', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->orWhere('receiver_id', $user->id)
            ->with(['sender:id,name,email,avatar', 'property:id,title'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Get unread messages count
        $unreadMessages = Message::whereHas('property', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->orWhere('receiver_id', $user->id)
            ->where('is_read', false)
            ->count();

        // Get property performance data (last 30 days)
        $performanceData = Property::where('user_id', $user->id)
            ->select('id', 'title', 'views', 'saves')
            ->orderBy('views', 'desc')
            ->limit(10)
            ->get();

        // Get subscription info (for agents)
        $subscription = null;
        $limits = null;
        if ($user->isAgent()) {
            $limits = app(SubscriptionLimitService::class)->getLimitsForUser($user);
            if ($user->subscribed('default')) {
                $sub = $user->subscription('default');
                $plan = SubscriptionPlan::where('stripe_price_id', $sub->stripe_price)->first();
                $subscription = [
                    'id' => $sub->id,
                    'plan' => $plan ? $plan->slug : 'default',
                    'plan_name' => $plan ? $plan->name : 'Default',
                    'plan_price' => $plan ? (float) $plan->price : null,
                    'status' => $sub->stripe_status,
                    'is_active' => $sub->active(),
                    'ends_at' => $sub->ends_at?->toIso8601String(),
                    'cancel_at_period_end' => $sub->cancel_at_period_end ?? false,
                    'days_remaining' => $sub->ends_at ? max(0, now()->diffInDays($sub->ends_at, false)) : null,
                ];
            }
        }

        return response()->json([
            'statistics' => [
                'total_properties' => $totalProperties,
                'active_listings' => $activeListings,
                'total_views' => $totalViews,
                'total_saves' => $totalSaves,
                'total_inquiries' => $totalInquiries,
                'unread_messages' => $unreadMessages,
            ],
            'subscription' => $subscription,
            'limits' => $limits,
            'recent_properties' => $properties,
            'recent_messages' => $recentMessages,
            'performance_data' => $performanceData,
        ]);
    }
}
