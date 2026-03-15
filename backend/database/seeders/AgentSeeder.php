<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AgentSeeder extends Seeder
{
    /**
     * Seed 10 agents. Safe to run multiple times (uses firstOrCreate by email).
     */
    public function run(): void
    {
        $agents = [
            [
                'name' => 'John Smith',
                'email' => 'agent1@test.com',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'phone' => '+1-555-0101',
                'bio' => 'Experienced real estate agent with over 10 years in the business. Specializing in luxury homes and commercial properties.',
                'company_name' => 'Premier Realty Group',
                'license_number' => 'RE-LIC-12345',
                'email_verified_at' => now(),
                'is_active' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Sarah Johnson',
                'email' => 'agent2@test.com',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'phone' => '+1-555-0102',
                'bio' => 'Dedicated real estate professional helping families find their dream homes. Expert in residential properties.',
                'company_name' => 'Dream Home Realty',
                'license_number' => 'RE-LIC-12346',
                'email_verified_at' => now(),
                'is_active' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Michael Brown',
                'email' => 'agent3@test.com',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'phone' => '+1-555-0103',
                'bio' => 'Commercial real estate specialist with expertise in office buildings and retail spaces.',
                'company_name' => 'Commercial Properties Inc',
                'license_number' => 'RE-LIC-12347',
                'email_verified_at' => now(),
                'is_active' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Jennifer Martinez',
                'email' => 'agent4@test.com',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'phone' => '+1-555-0104',
                'bio' => 'First-time buyer specialist. I make the process simple and stress-free for new homeowners.',
                'company_name' => 'First Key Realty',
                'license_number' => 'RE-LIC-12348',
                'email_verified_at' => now(),
                'is_active' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Robert Taylor',
                'email' => 'agent5@test.com',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'phone' => '+1-555-0105',
                'bio' => 'Luxury waterfront and estate specialist. Serving high-end clients with discretion and expertise.',
                'company_name' => 'Coastal Estates',
                'license_number' => 'RE-LIC-12349',
                'email_verified_at' => now(),
                'is_active' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Amanda Wilson',
                'email' => 'agent6@test.com',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'phone' => '+1-555-0106',
                'bio' => 'Condos and townhomes expert. Great at helping investors and young professionals find the right fit.',
                'company_name' => 'Urban Living Realty',
                'license_number' => 'RE-LIC-12350',
                'email_verified_at' => now(),
                'is_active' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'James Anderson',
                'email' => 'agent7@test.com',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'phone' => '+1-555-0107',
                'bio' => 'Multi-family and investment property specialist. Helping investors build their portfolios.',
                'company_name' => 'Investment Properties Co',
                'license_number' => 'RE-LIC-12351',
                'email_verified_at' => now(),
                'is_active' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Emily Clark',
                'email' => 'agent8@test.com',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'phone' => '+1-555-0108',
                'bio' => 'Relocation specialist. I help families and professionals transition smoothly to new cities.',
                'company_name' => 'Relocate Right',
                'license_number' => 'RE-LIC-12352',
                'email_verified_at' => now(),
                'is_active' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Daniel Lee',
                'email' => 'agent9@test.com',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'phone' => '+1-555-0109',
                'bio' => 'New construction and builder sales. Connect with top builders and get the best incentives.',
                'company_name' => 'New Home Advisors',
                'license_number' => 'RE-LIC-12353',
                'email_verified_at' => now(),
                'is_active' => true,
                'is_verified' => true,
            ],
            [
                'name' => 'Jessica Garcia',
                'email' => 'agent10@test.com',
                'password' => Hash::make('password123'),
                'role' => 'agent',
                'phone' => '+1-555-0110',
                'bio' => 'Full-service agent for buyers and sellers. Bilingual, serving diverse communities with care.',
                'company_name' => 'HomeBridge Realty',
                'license_number' => 'RE-LIC-12354',
                'email_verified_at' => now(),
                'is_active' => true,
                'is_verified' => true,
            ],
        ];

        foreach ($agents as $agent) {
            User::firstOrCreate(
                ['email' => $agent['email']],
                $agent
            );
        }
    }
}
