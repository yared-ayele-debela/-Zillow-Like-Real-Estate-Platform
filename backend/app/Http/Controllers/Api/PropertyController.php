<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePropertyRequest;
use App\Http\Requests\UpdatePropertyRequest;
use App\Models\Property;
use App\Services\GeocodingService;
use App\Services\PropertySearchService;
use App\Services\NearbyPropertiesService;
use App\Services\NeighborhoodDataService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PropertyController extends Controller
{
    protected GeocodingService $geocodingService;
    protected PropertySearchService $searchService;
    protected NearbyPropertiesService $nearbyService;
    protected NeighborhoodDataService $neighborhoodService;

    public function __construct(
        GeocodingService $geocodingService,
        PropertySearchService $searchService,
        NearbyPropertiesService $nearbyService,
        NeighborhoodDataService $neighborhoodService
    ) {
        $this->geocodingService = $geocodingService;
        $this->searchService = $searchService;
        $this->nearbyService = $nearbyService;
        $this->neighborhoodService = $neighborhoodService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Get all filters from request
        $filters = $request->only([
            'search',
            'property_type',
            'status',
            'min_price',
            'max_price',
            'bedrooms',
            'bathrooms',
            'min_square_feet',
            'max_square_feet',
            'min_year_built',
            'max_year_built',
            'city',
            'state',
            'zip_code',
            'amenities',
            'featured',
            'sort_by',
            'sort_order',
            'ids',
        ]);

        // Handle amenities array
        if ($request->has('amenities')) {
            $filters['amenities'] = is_array($request->amenities)
                ? $request->amenities
                : explode(',', $request->amenities);
        }

        // Build search query using search service
        // Allow admins to see unapproved properties
        $includeUnapproved = $request->user() && $request->user()->isAdmin();
        $query = $this->searchService->buildSearchQuery($filters, $includeUnapproved);

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query = $this->searchService->sortResults($query, $sortBy, $sortOrder);

        // Pagination
        $perPage = min($request->get('per_page', 15), 100);
        $properties = $query->paginate($perPage);

        return response()->json($properties);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePropertyRequest $request)
    {
        DB::beginTransaction();
        try {
            $data = $request->validated();
            $data['user_id'] = $request->user()->id;

            // If latitude/longitude are not provided, geocode from address parts
            if ($request->has('latitude') && $request->has('longitude')) {
                $data['latitude'] = $request->input('latitude');
                $data['longitude'] = $request->input('longitude');
            } else {
                $geocodeResult = $this->geocodingService->geocodeFullAddress(
                    $data['address'],
                    $data['city'],
                    $data['state'],
                    $data['zip_code'],
                    $data['country'] ?? 'ITAY'
                );

                if ($geocodeResult) {
                    $data['latitude'] = $geocodeResult['latitude'];
                    $data['longitude'] = $geocodeResult['longitude'];
                }
            }

            // Create property
            $property = Property::create($data);

            // Attach amenities
            if ($request->has('amenities')) {
                $property->amenities()->attach($request->amenities);
            }

            // Handle images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $image) {
                    $this->storeImage($property, $image, $index === 0);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Property created successfully',
                'property' => $property->load(['user', 'images', 'amenities']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create property',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $property = Property::with([
            'user:id,name,email,phone,avatar,company_name,license_number',
            'images' => function ($query) {
                $query->orderBy('order')->orderBy('is_primary', 'desc');
            },
            'amenities',
            'reviews.user:id,name,avatar',
        ])
            ->findOrFail($id);

        // Increment views
        $property->incrementViews();

        // Get price history
        $priceHistory = $property->getFormattedPriceHistory();

        // Get nearby properties (within 10 miles)
        $nearbyProperties = [];
        if ($property->latitude && $property->longitude) {
            $nearbyProperties = $this->nearbyService->findNearby(
                $property->latitude,
                $property->longitude,
                10, // 10 miles radius
                $property->id,
                null, // Any property type
                6 // Limit to 6 properties
            )->map(function ($prop) use ($property) {
                // Calculate distance
                $distance = $this->calculateDistance(
                    $property->latitude,
                    $property->longitude,
                    $prop->latitude,
                    $prop->longitude
                );
                return [
                    'id' => $prop->id,
                    'title' => $prop->title,
                    'price' => $prop->price,
                    'address' => $prop->address,
                    'city' => $prop->city,
                    'state' => $prop->state,
                    'property_type' => $prop->property_type,
                    'bedrooms' => $prop->bedrooms,
                    'bathrooms' => $prop->bathrooms,
                    'square_feet' => $prop->square_feet,
                    'primary_image' => $prop->primary_image?->image_url ?? null,
                    'distance' => round($distance, 2),
                ];
            });
        }

        // Get similar properties (same type, similar price)
        $similarProperties = $this->nearbyService->findSimilar($property, 0.2, 6)
            ->map(function ($prop) {
                return [
                    'id' => $prop->id,
                    'title' => $prop->title,
                    'price' => $prop->price,
                    'address' => $prop->address,
                    'city' => $prop->city,
                    'state' => $prop->state,
                    'property_type' => $prop->property_type,
                    'bedrooms' => $prop->bedrooms,
                    'bathrooms' => $prop->bathrooms,
                    'square_feet' => $prop->square_feet,
                    'primary_image' => $prop->primary_image?->image_url ?? null,
                ];
            });

        // Get statistics
        $stats = [
            'views' => $property->views,
            'saves' => $property->saves,
            'average_rating' => round($property->getAverageRating(), 1),
            'reviews_count' => $property->getReviewsCount(),
        ];

        // Get neighborhood data (schools, scores, etc.)
        $neighborhood = $this->neighborhoodService->getForProperty($property);

        return response()->json([
            'property' => $property,
            'price_history' => $priceHistory,
            'nearby_properties' => $nearbyProperties,
            'similar_properties' => $similarProperties,
            'stats' => $stats,
            'neighborhood' => $neighborhood,
        ]);
    }

    /**
     * Calculate distance between two coordinates in miles.
     */
    protected function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 3959; // Earth radius in miles

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePropertyRequest $request, string $id)
    {
        $property = Property::findOrFail($id);

        // Check ownership or admin
        if ($property->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        DB::beginTransaction();
        try {
            $data = $request->validated();
            $oldPrice = $property->price;

            // If explicit coordinates are provided, trust them; otherwise re-geocode when address changes
            if ($request->has('latitude') && $request->has('longitude')) {
                $data['latitude'] = $request->input('latitude');
                $data['longitude'] = $request->input('longitude');
            } elseif ($request->has('address') || $request->has('city') || $request->has('state') || $request->has('zip_code') || $request->has('country')) {
                $geocodeResult = $this->geocodingService->geocodeFullAddress(
                    $data['address'] ?? $property->address,
                    $data['city'] ?? $property->city,
                    $data['state'] ?? $property->state,
                    $data['zip_code'] ?? $property->zip_code,
                    $data['country'] ?? $property->country
                );

                if ($geocodeResult) {
                    $data['latitude'] = $geocodeResult['latitude'];
                    $data['longitude'] = $geocodeResult['longitude'];
                }
            }

            // Track price change
            if (isset($data['price']) && $data['price'] != $oldPrice) {
                $property->trackPriceChange($oldPrice, $data['price']);
            }

            // Update property
            $property->update($data);

            // Update amenities
            if ($request->has('amenities')) {
                $property->amenities()->sync($request->amenities);
            }

            // Handle new images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $this->storeImage($property, $image);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Property updated successfully',
                'property' => $property->fresh(['user', 'images', 'amenities']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update property',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $property = Property::findOrFail($id);

        // Check ownership or admin
        if ($property->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Delete images from storage
        foreach ($property->images as $image) {
            Storage::disk('public')->delete($image->image_path);
            if ($image->thumbnail_path) {
                Storage::disk('public')->delete($image->thumbnail_path);
            }
        }

        // Soft delete property
        $property->delete();

        return response()->json([
            'message' => 'Property deleted successfully',
        ]);
    }

    /**
     * Store image for property.
     */
    protected function storeImage(Property $property, $image, bool $isPrimary = false): void
    {
        $path = $image->store('properties', 'public');

        // Create thumbnail using Intervention Image
        $thumbnailPath = $this->createThumbnail($path);

        $property->images()->create([
            'image_path' => $path,
            'thumbnail_path' => $thumbnailPath,
            'is_primary' => $isPrimary,
            'order' => $property->images()->count(),
        ]);
    }

    /**
     * Create thumbnail from image.
     */
    protected function createThumbnail(string $imagePath): ?string
    {
        try {
            $fullPath = storage_path('app/public/' . $imagePath);
            $thumbnailPath = 'properties/thumbnails/' . basename($imagePath);
            $thumbnailFullPath = storage_path('app/public/' . $thumbnailPath);

            // Ensure thumbnail directory exists
            $thumbnailDir = dirname($thumbnailFullPath);
            if (!is_dir($thumbnailDir)) {
                mkdir($thumbnailDir, 0755, true);
            }

            // Use GD driver (more common than Imagick)
            $manager = new \Intervention\Image\ImageManager(
                new \Intervention\Image\Drivers\Gd\Driver()
            );

            $thumbnail = $manager->read($fullPath);
            $thumbnail->scale(width: 400, height: 300);
            $thumbnail->save($thumbnailFullPath);

            return $thumbnailPath;
        } catch (\Exception $e) {
            Log::error('Thumbnail creation failed', [
                'image' => $imagePath,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get agent's properties.
     */
    public function myProperties(Request $request)
    {
        $user = $request->user();

        if (!$user->isAgent() && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Only agents can access this endpoint.',
            ], 403);
        }

        $query = Property::where('user_id', $user->id)
            ->with(['images', 'amenities']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by approval status
        if ($request->has('is_approved')) {
            $isApproved = filter_var($request->is_approved, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_approved', $isApproved);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        $properties = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($properties);
    }

    /**
     * Get property statistics.
     */
    public function propertyStats(Request $request, string $id)
    {
        $user = $request->user();
        $property = Property::findOrFail($id);

        // Check ownership
        if ($property->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Get inquiries count
        $inquiriesCount = \App\Models\Message::where('property_id', $property->id)
            ->where('type', 'inquiry')
            ->count();

        // Get views over time (last 30 days)
        // Note: This would require a views_log table for detailed tracking
        // For now, we'll return the total views
        $viewsData = [
            'total' => $property->views,
            'last_30_days' => $property->views, // Placeholder - would need tracking table
        ];

        // Get saves count
        $savesData = [
            'total' => $property->saves,
        ];

        return response()->json([
            'property_id' => $property->id,
            'property_title' => $property->title,
            'views' => $viewsData,
            'saves' => $savesData,
            'inquiries' => $inquiriesCount,
            'rating' => [
                'average' => $property->getAverageRating(),
                'count' => $property->getReviewsCount(),
            ],
        ]);
    }

    /**
     * Update property availability/status.
     */
    public function updateAvailability(Request $request, string $id)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'status' => 'required|in:for_sale,for_rent,sold,off_market',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $property = Property::findOrFail($id);

        // Check ownership
        if ($property->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $property->update([
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Property status updated successfully',
            'property' => $property->fresh(),
        ]);
    }
}
