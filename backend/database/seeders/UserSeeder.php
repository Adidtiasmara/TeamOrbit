<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin TeamOrbit',
            'email' => 'admin@teamorbit.test',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Budi Member',
            'email' => 'budi@teamorbit.test',
            'password' => Hash::make('password'),
            'role' => 'member',
        ]);

        User::create([
            'name' => 'Ani Member',
            'email' => 'ani@teamorbit.test',
            'password' => Hash::make('password'),
            'role' => 'member',
        ]);

        User::create([
            'name' => 'Citra Member',
            'email' => 'citra@teamorbit.test',
            'password' => Hash::make('password'),
            'role' => 'member',
        ]);
    }
}
