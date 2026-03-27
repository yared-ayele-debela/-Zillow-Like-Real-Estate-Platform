<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('parent_message_id')
                ->nullable()
                ->after('property_id')
                ->constrained('messages')
                ->nullOnDelete();
            $table->unsignedBigInteger('thread_root_id')
                ->nullable()
                ->after('parent_message_id')
                ->index();
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->foreign('thread_root_id')
                ->references('id')
                ->on('messages')
                ->nullOnDelete();
        });

        // Backfill: each existing message is its own thread root
        DB::table('messages')->update(['thread_root_id' => DB::raw('id')]);
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['parent_message_id']);
            $table->dropForeign(['thread_root_id']);
            $table->dropColumn(['parent_message_id', 'thread_root_id']);
        });
    }
};
