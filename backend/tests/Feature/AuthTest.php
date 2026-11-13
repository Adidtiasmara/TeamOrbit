<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_berhasil_mengembalikan_token_dan_role_member(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Rina',
            'email' => 'rina@teamorbit.test',
            'password' => 'rahasia123',
            'password_confirmation' => 'rahasia123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['data' => ['user' => ['id', 'name', 'email', 'role'], 'token']])
            ->assertJsonPath('data.user.role', 'member')
            ->assertJsonMissing(['password']);

        $this->assertDatabaseHas('users', [
            'email' => 'rina@teamorbit.test',
            'role' => 'member',
        ]);
    }

    public function test_register_gagal_jika_password_kurang_dari_8_karakter(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Rina',
            'email' => 'rina@teamorbit.test',
            'password' => 'pendek',
            'password_confirmation' => 'pendek',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);

        $this->assertDatabaseMissing('users', ['email' => 'rina@teamorbit.test']);
    }

    public function test_register_gagal_jika_email_sudah_dipakai(): void
    {
        User::factory()->create(['email' => 'rina@teamorbit.test']);

        $this->postJson('/api/register', [
            'name' => 'Rina',
            'email' => 'rina@teamorbit.test',
            'password' => 'rahasia123',
            'password_confirmation' => 'rahasia123',
        ])->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_login_berhasil_mengembalikan_token(): void
    {
        $user = User::factory()->create(['password' => 'rahasia123']);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'rahasia123',
        ])->assertStatus(200)
            ->assertJsonStructure(['data' => ['user' => ['id', 'name', 'email', 'role'], 'token']])
            ->assertJsonPath('data.user.email', $user->email);
    }

    public function test_login_gagal_jika_password_salah(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password-salah',
        ])->assertStatus(401);
    }

    public function test_endpoint_terlindungi_menolak_request_tanpa_token(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
        $this->postJson('/api/logout')->assertStatus(401);
    }

    public function test_me_mengembalikan_user_yang_sedang_login(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/me')
            ->assertStatus(200)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.role', 'admin');
    }

    public function test_logout_mengembalikan_204_dan_mencabut_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/logout')
            ->assertStatus(204);

        // RequestGuard meng-cache user antar request di lingkungan test;
        // reset guard agar request berikutnya me-resolve ulang token dari awal
        // (di produksi tiap HTTP request adalah proses baru).
        $this->app->make('auth')->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me')
            ->assertStatus(401);
    }

    public function test_role_middleware_hanya_menerima_role_yang_sesuai(): void
    {
        Route::get('/testing/admin-only', fn () => response()->json(['data' => 'ok']))
            ->middleware(['auth:sanctum', 'role:admin']);

        $member = User::factory()->create(['role' => 'member']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($member, 'sanctum')
            ->getJson('/testing/admin-only')
            ->assertStatus(403)
            ->assertJsonPath('message', 'Akses ditolak.');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/testing/admin-only')
            ->assertStatus(200);
    }

    public function test_me_mengembalikan_json_persis_tanpa_field_lain(): void
    {
        $user = User::factory()->create(['name' => 'Rina', 'email' => 'rina@teamorbit.test']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/me')
            ->assertStatus(200)
            ->assertExactJson(['data' => [
                'id' => $user->id,
                'name' => 'Rina',
                'email' => 'rina@teamorbit.test',
                'role' => 'member',
            ]]);
    }

    public function test_register_dan_login_hanya_mengembalikan_user_dan_token(): void
    {
        $register = $this->postJson('/api/register', [
            'name' => 'Rina',
            'email' => 'rina@teamorbit.test',
            'password' => 'rahasia123',
            'password_confirmation' => 'rahasia123',
        ])->assertStatus(201);

        $login = $this->postJson('/api/login', [
            'email' => 'rina@teamorbit.test',
            'password' => 'rahasia123',
        ])->assertStatus(200);

        foreach ([$register, $login] as $response) {
            $this->assertSame(['data'], array_keys($response->json()));
            $this->assertSame(['user', 'token'], array_keys($response->json('data')));
            $this->assertSame(['id', 'name', 'email', 'role'], array_keys($response->json('data.user')));
            $this->assertIsString($response->json('data.token'));
        }
    }
}
