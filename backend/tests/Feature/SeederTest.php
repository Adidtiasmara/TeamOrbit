<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_membuat_akun_demo_dengan_password_password(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('users', 4);
        $this->assertDatabaseHas('users', ['email' => 'admin@teamorbit.test', 'role' => 'admin']);

        foreach (['budi', 'ani', 'citra'] as $name) {
            $this->assertDatabaseHas('users', ['email' => "{$name}@teamorbit.test", 'role' => 'member']);
        }

        $this->assertTrue(Hash::check('password', User::where('email', 'admin@teamorbit.test')->value('password')));
    }

    public function test_seeder_aman_dijalankan_ulang_tanpa_menimpa_perubahan(): void
    {
        $this->seed(DatabaseSeeder::class);
        User::where('email', 'budi@teamorbit.test')->update(['role' => 'admin']);

        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('users', 4);
        $this->assertDatabaseHas('users', ['email' => 'budi@teamorbit.test', 'role' => 'admin']);
    }
}
