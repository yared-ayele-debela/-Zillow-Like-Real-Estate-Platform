<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Migrate existing app_settings (key-value) data into web_settings and email_settings.
     */
    public function up(): void
    {
        $site = DB::table('app_settings')->where('key', 'site')->value('value');
        if ($site) {
            $data = is_string($site) ? json_decode($site, true) : $site;
            if (is_array($data)) {
                DB::table('web_settings')->where('id', 1)->update([
                    'site_name' => $data['site_name'] ?? 'Zillow Clone',
                    'site_description' => $data['site_description'] ?? null,
                    'maintenance_mode' => (bool) ($data['maintenance_mode'] ?? false),
                    'allow_registration' => (bool) ($data['allow_registration'] ?? true),
                    'require_email_verification' => (bool) ($data['require_email_verification'] ?? true),
                    'updated_at' => now(),
                ]);
            }
        }

        $email = DB::table('app_settings')->where('key', 'email')->value('value');
        if ($email) {
            $data = is_string($email) ? json_decode($email, true) : $email;
            if (is_array($data)) {
                DB::table('email_settings')->where('id', 1)->update([
                    'mail_driver' => $data['mail_driver'] ?? 'smtp',
                    'mail_host' => $data['mail_host'] ?? 'smtp.mailtrap.io',
                    'mail_port' => (string) ($data['mail_port'] ?? '2525'),
                    'mail_username' => $data['mail_username'] ?? null,
                    'mail_password' => $data['mail_password'] ?? null,
                    'mail_from_address' => $data['mail_from_address'] ?? 'noreply@example.com',
                    'mail_from_name' => $data['mail_from_name'] ?? 'Zillow Clone',
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migration (no-op; we don't restore app_settings).
     */
    public function down(): void
    {
        //
    }
};
