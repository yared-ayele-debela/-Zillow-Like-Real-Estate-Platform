<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Seeder;
use Laravel\Cashier\Subscription;

class PaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $agents = User::query()->where('role', 'agent')->get();
        $properties = Property::query()->get();
        $subscriptions = Subscription::query()->get()->keyBy('user_id');

        if ($agents->isEmpty()) {
            return;
        }

        foreach ($agents as $agent) {
            // Subscription payment (Cashier subscriptions)
            $subscription = $subscriptions->get($agent->id);
            if ($subscription) {
                $amount = 29.99; // default; could resolve from plan
                Payment::updateOrCreate(
                    [
                        'user_id' => $agent->id,
                        'type' => 'subscription',
                        'transaction_id' => 'txn_sub_' . $agent->id,
                    ],
                    [
                        'property_id' => null,
                        'amount' => $amount,
                        'currency' => 'USD',
                        'status' => 'completed',
                        'payment_method' => 'card',
                        'stripe_payment_intent_id' => 'pi_sub_' . $agent->id,
                        'metadata' => [
                            'plan' => 'basic',
                            'period' => 'monthly',
                        ],
                    ]
                );
            }

            // Featured listing payments
            $agentProperties = $properties->where('user_id', $agent->id)->take(2);
            foreach ($agentProperties as $property) {
                Payment::updateOrCreate(
                    [
                        'user_id' => $agent->id,
                        'property_id' => $property->id,
                        'type' => 'featured_listing',
                    ],
                    [
                        'amount' => [9.99, 29.99, 79.99][array_rand([9.99, 29.99, 79.99])],
                        'currency' => 'USD',
                        'status' => 'completed',
                        'payment_method' => 'card',
                        'transaction_id' => 'txn_feat_' . $agent->id . '_' . $property->id,
                        'stripe_payment_intent_id' => 'pi_feat_' . $agent->id . '_' . $property->id,
                        'metadata' => [
                            'boost_days' => [7, 30, 90][array_rand([7, 30, 90])],
                        ],
                    ]
                );
            }
        }
    }
}
