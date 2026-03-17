<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SubscriptionSeeder extends Seeder
{
    /**
     * Subscriptions are now managed by Laravel Cashier (Stripe Checkout).
     * No seed data; agents subscribe via the subscription page.
     */
    public function run(): void
    {
        // No-op: subscriptions are created via Cashier when agents checkout
    }
}
