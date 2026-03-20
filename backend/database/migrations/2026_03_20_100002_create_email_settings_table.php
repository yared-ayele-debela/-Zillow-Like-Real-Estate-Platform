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
        Schema::create('email_settings', function (Blueprint $table) {
            $table->id();
            $table->string('mail_driver', 50)->default('smtp');
            $table->string('mail_host', 255)->default('smtp.mailtrap.io');
            $table->string('mail_port', 10)->default('2525');
            $table->string('mail_username', 255)->nullable();
            $table->string('mail_password', 255)->nullable();
            $table->string('mail_from_address', 255)->default('noreply@example.com');
            $table->string('mail_from_name', 120)->default('Zillow Clone');
            $table->timestamps();
        });

        // Insert default row
        DB::table('email_settings')->insert([
            'mail_driver' => 'smtp',
            'mail_host' => 'smtp.mailtrap.io',
            'mail_port' => '2525',
            'mail_from_address' => 'noreply@example.com',
            'mail_from_name' => 'Zillow Clone',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_settings');
    }
};
