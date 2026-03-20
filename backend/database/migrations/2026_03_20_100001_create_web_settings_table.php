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
        Schema::create('web_settings', function (Blueprint $table) {
            $table->id();
            $table->string('site_name', 120)->default('Zillow Clone');
            $table->text('site_description')->nullable();
            $table->boolean('maintenance_mode')->default(false);
            $table->boolean('allow_registration')->default(true);
            $table->boolean('require_email_verification')->default(true);
            $table->string('logo')->nullable();
            $table->string('favicon')->nullable();
            $table->timestamps();
        });

        // Insert default row
        DB::table('web_settings')->insert([
            'site_name' => 'Zillow Clone',
            'site_description' => 'Real Estate Platform',
            'maintenance_mode' => false,
            'allow_registration' => true,
            'require_email_verification' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('web_settings');
    }
};
