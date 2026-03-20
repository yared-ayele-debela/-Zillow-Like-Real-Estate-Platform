<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailSetting extends Model
{
    protected $table = 'email_settings';

    protected $fillable = [
        'mail_driver',
        'mail_host',
        'mail_port',
        'mail_username',
        'mail_password',
        'mail_from_address',
        'mail_from_name',
    ];

    /**
     * Get the singleton email settings (first row).
     */
    public static function get(): self
    {
        $setting = static::first();
        if (! $setting) {
            $setting = static::create([
                'mail_driver' => 'smtp',
                'mail_host' => 'smtp.mailtrap.io',
                'mail_port' => '2525',
                'mail_from_address' => 'noreply@example.com',
                'mail_from_name' => 'Zillow Clone',
            ]);
        }

        return $setting;
    }
}
