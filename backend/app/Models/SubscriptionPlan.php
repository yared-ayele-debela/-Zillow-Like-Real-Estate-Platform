<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'price',
        'currency',
        'features',
        'stripe_price_id',
        'is_active',
        'sort_order',
        'max_listings',
        'max_featured_listings',
        'analytics_advanced',
        'api_access',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'max_listings' => 'integer',
        'max_featured_listings' => 'integer',
        'analytics_advanced' => 'boolean',
        'api_access' => 'boolean',
    ];
}
