<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Akun demo. Aman dijalankan berulang (mis. setiap container backend
 * menyala): akun yang sudah ada tidak diduplikasi dan tidak ditimpa,
 * jadi perubahan role lewat halaman Kelola pengguna tetap tersimpan.
 */
class UserSeeder extends Seeder
{
    private const ACCOUNTS = [
        ['name' => 'Admin TeamOrbit', 'email' => 'admin@teamorbit.test', 'role' => User::ROLE_ADMIN],
        ['name' => 'Budi Member', 'email' => 'budi@teamorbit.test', 'role' => User::ROLE_MEMBER],
        ['name' => 'Ani Member', 'email' => 'ani@teamorbit.test', 'role' => User::ROLE_MEMBER],
        ['name' => 'Citra Member', 'email' => 'citra@teamorbit.test', 'role' => User::ROLE_MEMBER],
    ];

    public function run(): void
    {
        foreach (self::ACCOUNTS as $account) {
            User::firstOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make('password'),
                    'role' => $account['role'],
                ],
            );
        }
    }
}
