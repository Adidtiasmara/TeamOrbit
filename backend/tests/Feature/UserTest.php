<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_endpoint_user_menolak_request_tanpa_token(): void
    {
        $user = User::factory()->create();

        $this->getJson('/api/users')->assertStatus(401);
        $this->putJson("/api/users/{$user->id}/role", ['role' => 'admin'])->assertStatus(401);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'role' => 'member']);
    }

    public function test_admin_melihat_semua_user_tanpa_data_sensitif(): void
    {
        $admin = User::factory()->admin()->create(['name' => 'Admin']);
        $budi = User::factory()->create(['name' => 'Budi', 'email' => 'budi@teamorbit.test']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/users')
            ->assertStatus(200)
            ->assertExactJson(['data' => [
                ['id' => $admin->id, 'name' => 'Admin', 'email' => $admin->email, 'role' => 'admin'],
                ['id' => $budi->id, 'name' => 'Budi', 'email' => 'budi@teamorbit.test', 'role' => 'member'],
            ]]);
    }

    public function test_member_tidak_bisa_melihat_atau_mengubah_user(): void
    {
        $member = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($member, 'sanctum');

        $this->getJson('/api/users')
            ->assertStatus(403)
            ->assertJsonPath('message', 'Akses ditolak.');
        $this->putJson("/api/users/{$other->id}/role", ['role' => 'admin'])->assertStatus(403);
        $this->putJson("/api/users/{$member->id}/role", ['role' => 'admin'])->assertStatus(403);
        // Role dicek sebelum mencari user, jadi id yang tidak ada pun tetap 403.
        $this->putJson('/api/users/99999/role', ['role' => 'admin'])->assertStatus(403);

        $this->assertDatabaseHas('users', ['id' => $member->id, 'role' => 'member']);
        $this->assertDatabaseHas('users', ['id' => $other->id, 'role' => 'member']);
    }

    public function test_admin_bisa_mengubah_role_user_lain(): void
    {
        $admin = User::factory()->admin()->create();
        $budi = User::factory()->create(['name' => 'Budi']);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/users/{$budi->id}/role", ['role' => 'admin'])
            ->assertStatus(200)
            ->assertExactJson(['data' => [
                'id' => $budi->id,
                'name' => 'Budi',
                'email' => $budi->email,
                'role' => 'admin',
            ]]);

        $this->assertDatabaseHas('users', ['id' => $budi->id, 'role' => 'admin']);

        $this->putJson("/api/users/{$budi->id}/role", ['role' => 'member'])
            ->assertStatus(200)
            ->assertJsonPath('data.role', 'member');

        $this->assertDatabaseHas('users', ['id' => $budi->id, 'role' => 'member']);
    }

    public function test_admin_tidak_bisa_mengubah_role_dirinya_sendiri(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/users/{$admin->id}/role", ['role' => 'member'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Validasi gagal.')
            ->assertJsonPath('errors.role.0', 'Kamu tidak bisa mengubah role akunmu sendiri.');

        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => 'admin']);
    }

    public function test_role_wajib_dan_harus_admin_atau_member(): void
    {
        $admin = User::factory()->admin()->create();
        $budi = User::factory()->create();

        $this->actingAs($admin, 'sanctum');

        $this->putJson("/api/users/{$budi->id}/role", [])
            ->assertStatus(422)
            ->assertJsonPath('errors.role.0', 'Role wajib dipilih.');

        $this->putJson("/api/users/{$budi->id}/role", ['role' => 'superadmin'])
            ->assertStatus(422)
            ->assertJsonPath('errors.role.0', 'Role harus admin atau member.');

        $this->assertDatabaseHas('users', ['id' => $budi->id, 'role' => 'member']);
    }

    public function test_mengubah_role_user_yang_tidak_ada_mengembalikan_404(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/users/99999/role', ['role' => 'admin'])
            ->assertStatus(404)
            ->assertJsonPath('message', 'Data tidak ditemukan.');
    }

    public function test_perubahan_role_langsung_berlaku_untuk_token_yang_ada(): void
    {
        $admin = User::factory()->admin()->create();
        $budi = User::factory()->create();
        $token = $budi->createToken('auth')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/users')
            ->assertStatus(403);

        $this->app->make('auth')->forgetGuards();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/users/{$budi->id}/role", ['role' => 'admin'])
            ->assertStatus(200);

        $this->app->make('auth')->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/users')
            ->assertStatus(200);
    }
}
