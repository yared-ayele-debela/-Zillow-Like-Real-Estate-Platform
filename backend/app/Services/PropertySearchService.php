<?php

namespace App\Services;

use App\Models\Property;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PropertySearchService
{
    /**
     * Build search query with all filters.
     */
    public function buildSearchQuery(array $filters = [], bool $includeUnapproved = false): Builder
    {
        $query = Property::with(['user', 'images', 'amenities']);
        
        // Only show approved properties unless admin/owner
        if (!$includeUnapproved) {
            $query->where('is_approved', true);
        }

        // Explicit ID filter (used for comparison view; accepts numeric ids or uuids)
        if (!empty($filters['ids'])) {
            $ids = is_array($filters['ids'])
                ? $filters['ids']
                : explode(',', (string) $filters['ids']);

            $ids = array_filter(array_map('trim', $ids));
            $resolvedIds = Property::resolveIdsToNumeric($ids);

            if (!empty($resolvedIds)) {
                $query->whereIn('id', $resolvedIds);
            }

            return $query;
        }

        // Text search
        if (!empty($filters['search'])) {
            $query = $this->searchByText($query, $filters['search']);
        }

        // Price filter
        if (isset($filters['min_price']) || isset($filters['max_price'])) {
            $query = $this->filterByPrice(
                $query,
                $filters['min_price'] ?? null,
                $filters['max_price'] ?? null
            );
        }

        // Location filters
        if (!empty($filters['city'])) {
            $query->where('city', 'like', '%' . $filters['city'] . '%');
        }
        if (!empty($filters['state'])) {
            $query->where('state', $filters['state']);
        }
        if (!empty($filters['zip_code'])) {
            $query->where('zip_code', $filters['zip_code']);
        }

        // Property type
        if (!empty($filters['property_type'])) {
            $query->where('property_type', $filters['property_type']);
        }

        // Status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Bedrooms
        if (isset($filters['bedrooms']) && $filters['bedrooms'] !== '') {
            $query->where('bedrooms', '>=', (int) $filters['bedrooms']);
        }

        // Bathrooms
        if (isset($filters['bathrooms']) && $filters['bathrooms'] !== '') {
            $query->where('bathrooms', '>=', (float) $filters['bathrooms']);
        }

        // Square feet
        if (isset($filters['min_square_feet']) || isset($filters['max_square_feet'])) {
            $query = $this->filterBySquareFeet(
                $query,
                $filters['min_square_feet'] ?? null,
                $filters['max_square_feet'] ?? null
            );
        }

        // Year built
        if (isset($filters['min_year_built']) || isset($filters['max_year_built'])) {
            $query = $this->filterByYearBuilt(
                $query,
                $filters['min_year_built'] ?? null,
                $filters['max_year_built'] ?? null
            );
        }

        // Amenities
        if (!empty($filters['amenities']) && is_array($filters['amenities'])) {
            $query = $this->filterByAmenities($query, $filters['amenities']);
        }

        // Featured
        if (isset($filters['featured']) && $filters['featured']) {
            $query->where('is_featured', true);
        }

        // Map bounds
        if (isset($filters['bounds'])) {
            $query = $this->filterByBounds($query, $filters['bounds']);
        }

        // Radius search (lat, lng, radius in miles)
        if (isset($filters['latitude']) && isset($filters['longitude']) && isset($filters['radius'])) {
            $query = $this->filterByRadius(
                $query,
                (float) $filters['latitude'],
                (float) $filters['longitude'],
                (float) $filters['radius']
            );
        }

        // Filter by created date (for notifications)
        if (isset($filters['created_after'])) {
            $query->where('created_at', '>', $filters['created_after']);
        }

        return $query;
    }

    /**
     * Full-text search on title, description, and address.
     */
    public function searchByText(Builder $query, string $searchTerm): Builder
    {
        $searchTerm = trim($searchTerm);
        
        if (empty($searchTerm)) {
            return $query;
        }

        // Use MySQL FULLTEXT search if available, otherwise use LIKE
        return $query->where(function ($q) use ($searchTerm) {
            $q->where('title', 'like', "%{$searchTerm}%")
                ->orWhere('description', 'like', "%{$searchTerm}%")
                ->orWhere('address', 'like', "%{$searchTerm}%")
                ->orWhere('city', 'like', "%{$searchTerm}%")
                ->orWhere('state', 'like', "%{$searchTerm}%");
        });
    }

    /**
     * Filter by price range.
     */
    public function filterByPrice(Builder $query, ?float $minPrice = null, ?float $maxPrice = null): Builder
    {
        if ($minPrice !== null) {
            $query->where('price', '>=', $minPrice);
        }
        if ($maxPrice !== null) {
            $query->where('price', '<=', $maxPrice);
        }
        return $query;
    }

    /**
     * Filter by location (city, state, zip).
     */
    public function filterByLocation(Builder $query, ?string $city = null, ?string $state = null, ?string $zipCode = null): Builder
    {
        if ($city) {
            $query->where('city', 'like', "%{$city}%");
        }
        if ($state) {
            $query->where('state', $state);
        }
        if ($zipCode) {
            $query->where('zip_code', $zipCode);
        }
        return $query;
    }

    /**
     * Filter by property type.
     */
    public function filterByPropertyType(Builder $query, string $type): Builder
    {
        return $query->where('property_type', $type);
    }

    /**
     * Filter by bedrooms.
     */
    public function filterByBedrooms(Builder $query, int $bedrooms): Builder
    {
        return $query->where('bedrooms', '>=', $bedrooms);
    }

    /**
     * Filter by bathrooms.
     */
    public function filterByBathrooms(Builder $query, float $bathrooms): Builder
    {
        return $query->where('bathrooms', '>=', $bathrooms);
    }

    /**
     * Filter by square feet range.
     */
    public function filterBySquareFeet(Builder $query, ?int $min = null, ?int $max = null): Builder
    {
        if ($min !== null) {
            $query->where('square_feet', '>=', $min);
        }
        if ($max !== null) {
            $query->where('square_feet', '<=', $max);
        }
        return $query;
    }

    /**
     * Filter by year built range.
     */
    public function filterByYearBuilt(Builder $query, ?int $min = null, ?int $max = null): Builder
    {
        if ($min !== null) {
            $query->where('year_built', '>=', $min);
        }
        if ($max !== null) {
            $query->where('year_built', '<=', $max);
        }
        return $query;
    }

    /**
     * Filter by amenities.
     */
    public function filterByAmenities(Builder $query, array $amenityIds): Builder
    {
        return $query->whereHas('amenities', function ($q) use ($amenityIds) {
            $q->whereIn('amenities.id', $amenityIds);
        }, '>=', count($amenityIds));
    }

    /**
     * Filter by status.
     */
    public function filterByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Filter by map bounds.
     */
    public function filterByBounds(Builder $query, array $bounds): Builder
    {
        if (isset($bounds['north'], $bounds['south'], $bounds['east'], $bounds['west'])) {
            $query->whereBetween('latitude', [$bounds['south'], $bounds['north']])
                ->whereBetween('longitude', [$bounds['west'], $bounds['east']]);
        }
        return $query;
    }

    /**
     * Filter by radius (Haversine formula).
     */
    public function filterByRadius(Builder $query, float $latitude, float $longitude, float $radiusMiles): Builder
    {
        $earthRadius = 3959; // Earth radius in miles

        return $query->selectRaw(
            "*, (
                {$earthRadius} * acos(
                    cos(radians(?)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians(?)) +
                    sin(radians(?)) * sin(radians(latitude))
                )
            ) AS distance",
            [$latitude, $longitude, $latitude]
        )
        ->having('distance', '<=', $radiusMiles)
        ->orderBy('distance');
    }

    /**
     * Sort results.
     */
    public function sortResults(Builder $query, string $sortBy = 'created_at', string $sortOrder = 'desc'): Builder
    {
        $allowedSorts = ['price', 'created_at', 'updated_at', 'views', 'saves', 'square_feet'];
        
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return $query;
    }

    /**
     * Get cached search results.
     */
    public function getCachedResults(string $cacheKey, callable $callback, int $ttl = 3600)
    {
        return Cache::remember($cacheKey, $ttl, $callback);
    }

    /**
     * Search properties with all filters.
     */
    public function search(array $filters = [], int $perPage = 15)
    {
        $cacheKey = 'property_search:' . md5(json_encode($filters));
        
        return $this->getCachedResults($cacheKey, function () use ($filters, $perPage) {
            $query = $this->buildSearchQuery($filters);
            
            // Apply sorting
            $sortBy = $filters['sort_by'] ?? 'created_at';
            $sortOrder = $filters['sort_order'] ?? 'desc';
            $query = $this->sortResults($query, $sortBy, $sortOrder);
            
            return $query->paginate($perPage);
        }, 300); // Cache for 5 minutes
    }
}
