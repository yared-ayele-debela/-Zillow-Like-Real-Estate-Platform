<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('lead_status', 32)
                ->default('new')
                ->index()
                ->after('type');

            $table->timestamp('next_follow_up_at')
                ->nullable()
                ->after('lead_status');

            $table->unsignedTinyInteger('lead_score')
                ->nullable()
                ->after('next_follow_up_at');

            $table->index('next_follow_up_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['lead_status']);
            $table->dropIndex(['next_follow_up_at']);
            $table->dropColumn(['lead_status', 'next_follow_up_at', 'lead_score']);
        });
    }
};

