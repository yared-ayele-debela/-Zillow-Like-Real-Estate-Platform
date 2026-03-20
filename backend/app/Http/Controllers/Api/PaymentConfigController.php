<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeaturedListingPackage;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentConfigController extends Controller
{
    public function plans()
    {
        return response()->json(
            SubscriptionPlan::where('is_active', true)
                ->orderBy('sort_order')
                ->get()
        );
    }

    public function featuredPackages()
    {
        return response()->json(
            FeaturedListingPackage::where('is_active', true)
                ->orderBy('sort_order')
                ->get()
        );
    }

    public function adminPlans()
    {
        return response()->json(SubscriptionPlan::orderBy('sort_order')->get());
    }

    public function storePlan(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:subscription_plans,slug',
            'price' => 'required|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'features' => 'nullable|array',
            'stripe_price_id' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
            'max_listings' => 'sometimes|integer|min:0',
            'max_featured_listings' => 'sometimes|integer|min:0',
            'analytics_advanced' => 'sometimes|boolean',
            'api_access' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $plan = SubscriptionPlan::create([
            'name' => $request->name,
            'slug' => $request->slug,
            'price' => $request->price,
            'currency' => strtoupper($request->currency ?? 'USD'),
            'features' => $request->features ?? [],
            'stripe_price_id' => $request->stripe_price_id,
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->sort_order ?? 0,
            'max_listings' => $request->input('max_listings', 10),
            'max_featured_listings' => $request->input('max_featured_listings', 0),
            'analytics_advanced' => $request->boolean('analytics_advanced', false),
            'api_access' => $request->boolean('api_access', false),
        ]);

        return response()->json($plan, 201);
    }

    public function updatePlan(Request $request, string $id)
    {
        $plan = SubscriptionPlan::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:100',
            'slug' => 'sometimes|string|max:100|unique:subscription_plans,slug,' . $plan->id,
            'price' => 'sometimes|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'features' => 'nullable|array',
            'stripe_price_id' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
            'max_listings' => 'sometimes|integer|min:0',
            'max_featured_listings' => 'sometimes|integer|min:0',
            'analytics_advanced' => 'sometimes|boolean',
            'api_access' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only([
            'name',
            'slug',
            'price',
            'features',
            'stripe_price_id',
            'is_active',
            'sort_order',
            'max_listings',
            'max_featured_listings',
            'analytics_advanced',
            'api_access',
        ]);
        if ($request->has('currency')) {
            $data['currency'] = strtoupper($request->currency);
        }

        $plan->update($data);
        return response()->json($plan->fresh());
    }

    public function deletePlan(string $id)
    {
        SubscriptionPlan::findOrFail($id)->delete();
        return response()->json(['message' => 'Plan deleted']);
    }

    public function adminFeaturedPackages()
    {
        return response()->json(FeaturedListingPackage::orderBy('sort_order')->get());
    }

    public function storeFeaturedPackage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'duration_days' => 'required|integer|min:1|max:3650',
            'price' => 'required|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $pkg = FeaturedListingPackage::create([
            'name' => $request->name,
            'duration_days' => $request->duration_days,
            'price' => $request->price,
            'currency' => strtoupper($request->currency ?? 'USD'),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => $request->sort_order ?? 0,
        ]);

        return response()->json($pkg, 201);
    }

    public function updateFeaturedPackage(Request $request, string $id)
    {
        $pkg = FeaturedListingPackage::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:100',
            'duration_days' => 'sometimes|integer|min:1|max:3650',
            'price' => 'sometimes|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['name', 'duration_days', 'price', 'is_active', 'sort_order']);
        if ($request->has('currency')) {
            $data['currency'] = strtoupper($request->currency);
        }

        $pkg->update($data);
        return response()->json($pkg->fresh());
    }

    public function deleteFeaturedPackage(string $id)
    {
        FeaturedListingPackage::findOrFail($id)->delete();
        return response()->json(['message' => 'Featured package deleted']);
    }
}
