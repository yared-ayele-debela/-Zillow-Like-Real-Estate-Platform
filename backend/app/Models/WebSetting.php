<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebSetting extends Model
{
    protected $table = 'web_settings';

    protected $fillable = [
        'site_name',
        'site_description',
        'maintenance_mode',
        'allow_registration',
        'require_email_verification',
        'logo',
        'favicon',
    ];

    protected $casts = [
        'maintenance_mode' => 'boolean',
        'allow_registration' => 'boolean',
        'require_email_verification' => 'boolean',
    ];

    /**
     * Get the singleton web settings (first row).
     */
    public static function get(): self
    {
        $setting = static::first();
        if (! $setting) {
            $setting = static::create([
                'site_name' => 'Zillow Clone',
                'site_description' => 'Real Estate Platform',
                'maintenance_mode' => false,
                'allow_registration' => true,
                'require_email_verification' => true,
            ]);
        }

        return $setting;
    }
}
