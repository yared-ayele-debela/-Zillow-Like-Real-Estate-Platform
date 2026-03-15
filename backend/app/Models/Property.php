<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

class Property extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'uuid',
        'title',
        'description',
        'property_type',
        'status',
        'price',
        'address',
        'city',
        'state',
        'zip_code',
        'country',
        'latitude',
        'longitude',
        'bedrooms',
        'bathrooms',
        'square_feet',
        'year_built',
        'lot_size',
        'is_featured',
        'is_approved',
        'price_history',
        'virtual_tour_url',
        'video_tour_url',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
        'square_feet' => 'integer',
        'year_built' => 'integer',
        'lot_size' => 'integer',
        'is_featured' => 'boolean',
        'is_approved' => 'boolean',
        'views' => 'integer',
        'saves' => 'integer',
        'price_history' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (Property $property) {
            if (empty($property->uuid)) {
                $property->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Find a property by id or uuid.
     */
    public static function findByIdOrUuid(string|int $value): ?Property
    {
        if (is_numeric($value)) {
            return static::find((int) $value);
        }
        return static::where('uuid', $value)->first();
    }

    /**
     * Find a property by id or uuid or fail.
     */
    public static function findByIdOrUuidOrFail(string|int $value): Property
    {
        $property = static::findByIdOrUuid($value);
        if (!$property) {
            abort(404);
        }
        return $property;
    }

    /**
     * Resolve an array of ids or uuids to numeric ids.
     */
    public static function resolveIdsToNumeric(array $values): array
    {
        if (empty($values)) {
            return [];
        }
        $ids = [];
        foreach ($values as $v) {
            $v = is_string($v) ? trim($v) : $v;
            if ($v === '') {
                continue;
            }
            if (is_numeric($v)) {
                $ids[] = (int) $v;
            } else {
                $p = static::where('uuid', $v)->first();
                if ($p) {
                    $ids[] = $p->id;
                }
            }
        }
        return array_values(array_unique($ids));
    }

    /**
     * Get the user that owns the property.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the images for the property.
     */
    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('order');
    }

    /**
     * Get the amenities for the property.
     */
    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class, 'property_amenities')
            ->withTimestamps();
    }

    /**
     * Get the users who favorited this property.
     */
    public function favorites(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites')
            ->withTimestamps();
    }

    /**
     * Get the reviews for the property.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get the primary image.
     */
    public function getPrimaryImageAttribute()
    {
        return $this->images()->where('is_primary', true)->first()
            ?? $this->images()->orderBy('order')->first();
    }

    /**
     * Get formatted price.
     */
    public function getFormattedPriceAttribute(): string
    {
        return '$' . Number::format($this->price, 0);
    }

    /**
     * Scope a query to only include properties for sale.
     */
    public function scopeForSale(Builder $query): Builder
    {
        return $query->where('status', 'for_sale');
    }

    /**
     * Scope a query to only include properties for rent.
     */
    public function scopeForRent(Builder $query): Builder
    {
        return $query->where('status', 'for_rent');
    }

    /**
     * Scope a query to only include approved properties.
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('is_approved', true);
    }

    /**
     * Scope a query to only include featured properties.
     */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope a query to filter by property type.
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('property_type', $type);
    }

    /**
     * Scope a query to filter by price range.
     */
    public function scopePriceRange(Builder $query, ?float $min = null, ?float $max = null): Builder
    {
        if ($min !== null) {
            $query->where('price', '>=', $min);
        }
        if ($max !== null) {
            $query->where('price', '<=', $max);
        }
        return $query;
    }

    /**
     * Scope a query to filter by bedrooms.
     */
    public function scopeBedrooms(Builder $query, int $bedrooms): Builder
    {
        return $query->where('bedrooms', '>=', $bedrooms);
    }

    /**
     * Scope a query to filter by bathrooms.
     */
    public function scopeBathrooms(Builder $query, int $bathrooms): Builder
    {
        return $query->where('bathrooms', '>=', $bathrooms);
    }

    /**
     * Increment views counter.
     */
    public function incrementViews(): void
    {
        $this->increment('views');
    }

    /**
     * Track price change in history.
     */
    public function trackPriceChange(float $oldPrice, float $newPrice): void
    {
        $history = $this->price_history ?? [];

        // Add initial price if history is empty
        if (empty($history)) {
            $history[] = [
                'date' => $this->created_at->toDateString(),
                'price' => (float) $oldPrice,
                'change' => 0,
            ];
        }

        // Add new price entry
        $change = $newPrice - $oldPrice;
        $changePercent = $oldPrice > 0 ? ($change / $oldPrice) * 100 : 0;

        $history[] = [
            'date' => now()->toDateString(),
            'price' => (float) $newPrice,
            'change' => (float) $change,
            'change_percent' => round($changePercent, 2),
        ];

        $this->update(['price_history' => $history]);
    }

    /**
     * Get formatted price history for charts.
     */
    public function getFormattedPriceHistory(): array
    {
        $history = $this->price_history ?? [];

        // If no history, return current price
        if (empty($history)) {
            return [
                [
                    'date' => $this->created_at->toDateString(),
                    'price' => (float) $this->price,
                    'change' => 0,
                ],
            ];
        }

        return $history;
    }

    /**
     * Get average rating from reviews.
     */
    public function getAverageRating(): float
    {
        return $this->reviews()->avg('rating') ?? 0;
    }

    /**
     * Get total reviews count.
     */
    public function getReviewsCount(): int
    {
        return $this->reviews()->count();
    }
}
