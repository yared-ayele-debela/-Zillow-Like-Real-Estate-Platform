<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('id');
        });

        // Backfill existing rows
        $rows = \DB::table('properties')->whereNull('uuid')->get();
        foreach ($rows as $row) {
            \DB::table('properties')->where('id', $row->id)->update([
                'uuid' => (string) Str::uuid(),
            ]);
        }

    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
};
