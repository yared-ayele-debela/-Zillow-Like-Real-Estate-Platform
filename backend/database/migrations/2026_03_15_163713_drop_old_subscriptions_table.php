<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop the legacy subscriptions table so Laravel Cashier can create its own.
     */
    public function up(): void
    {
        Schema::dropIfExists('subscriptions');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore would require re-creating the old table structure; leave empty for Cashier migration rollback
    }
};
