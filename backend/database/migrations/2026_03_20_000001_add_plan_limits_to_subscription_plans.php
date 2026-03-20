<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->unsignedInteger('max_listings')->default(10)->after('sort_order');
            $table->unsignedInteger('max_featured_listings')->default(0)->after('max_listings');
            $table->boolean('analytics_advanced')->default(false)->after('max_featured_listings');
            $table->boolean('api_access')->default(false)->after('analytics_advanced');
        });

        // Set plan-specific limits
        DB::table('subscription_plans')->where('slug', 'basic')->update([
            'max_listings' => 10,
            'max_featured_listings' => 0,
            'analytics_advanced' => false,
            'api_access' => false,
        ]);
        DB::table('subscription_plans')->where('slug', 'premium')->update([
            'max_listings' => 0, // 0 = unlimited
            'max_featured_listings' => 5,
            'analytics_advanced' => true,
            'api_access' => false,
        ]);
        DB::table('subscription_plans')->where('slug', 'enterprise')->update([
            'max_listings' => 0,
            'max_featured_listings' => 0, // 0 = unlimited
            'analytics_advanced' => true,
            'api_access' => true,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn(['max_listings', 'max_featured_listings', 'analytics_advanced', 'api_access']);
        });
    }
};
