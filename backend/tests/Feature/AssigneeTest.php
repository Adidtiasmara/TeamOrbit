<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssigneeTest extends TestCase
{
    use RefreshDatabase;

    public function test_endpoint_assignee_menolak_request_tanpa_token(): void
    {
        $task = Task::factory()->create();
        $user = User::factory()->create();
        $task->assignees()->attach($user);

        $this->postJson("/api/tasks/{$task->id}/assignees", ['user_id' => $user->id])->assertStatus(401);
        $this->deleteJson("/api/tasks/{$task->id}/assignees/{$user->id}")->assertStatus(401);
        $this->getJson('/api/assignable-users')->assertStatus(401);

        $this->assertDatabaseCount('task_user', 1);
    }

    public function test_pembuat_bisa_menambah_assignee_dan_mendapat_data_tugas_terbaru(): void
    {
        $creator = User::factory()->create();
        $budi = User::factory()->create(['name' => 'Budi']);
        $task = Task::factory()->create(['created_by' => $creator->id]);

        $this->actingAs($creator, 'sanctum')
            ->postJson("/api/tasks/{$task->id}/assignees", ['user_id' => $budi->id])
            ->assertStatus(201)
            ->assertJsonPath('data.id', $task->id)
            ->assertJsonPath('data.assignees', [['id' => $budi->id, 'name' => 'Budi']]);

        $this->assertDatabaseHas('task_user', ['task_id' => $task->id, 'user_id' => $budi->id]);
    }

    public function test_pembuat_bisa_menugaskan_dirinya_sendiri(): void
    {
        $creator = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $creator->id]);

        $this->actingAs($creator, 'sanctum')
            ->postJson("/api/tasks/{$task->id}/assignees", ['user_id' => $creator->id])
            ->assertStatus(201)
            ->assertJsonPath('data.assignees.0.id', $creator->id);

        $this->assertDatabaseHas('task_user', ['task_id' => $task->id, 'user_id' => $creator->id]);
    }

    public function test_assignee_duplikat_ditolak_422(): void
    {
        $creator = User::factory()->create();
        $budi = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $creator->id]);
        $task->assignees()->attach($budi);

        $this->actingAs($creator, 'sanctum')
            ->postJson("/api/tasks/{$task->id}/assignees", ['user_id' => $budi->id])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Validasi gagal.')
            ->assertJsonPath('errors.user_id.0', 'User sudah menjadi assignee tugas ini.');

        $this->assertDatabaseCount('task_user', 1);
    }

    public function test_user_id_wajib_diisi_dan_harus_terdaftar(): void
    {
        $creator = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $creator->id]);

        $this->actingAs($creator, 'sanctum');

        $this->postJson("/api/tasks/{$task->id}/assignees", [])
            ->assertStatus(422)
            ->assertJsonPath('errors.user_id.0', 'User wajib dipilih.');

        $this->postJson("/api/tasks/{$task->id}/assignees", ['user_id' => 99999])
            ->assertStatus(422)
            ->assertJsonPath('errors.user_id.0', 'User tidak ditemukan.');

        $this->assertDatabaseCount('task_user', 0);
    }

    public function test_assignee_bisa_menambah_dan_menghapus_assignee_lain(): void
    {
        $assignee = User::factory()->create();
        $ani = User::factory()->create();
        $task = Task::factory()->create();
        $task->assignees()->attach($assignee);

        $this->actingAs($assignee, 'sanctum');

        $this->postJson("/api/tasks/{$task->id}/assignees", ['user_id' => $ani->id])->assertStatus(201);
        $this->assertDatabaseHas('task_user', ['task_id' => $task->id, 'user_id' => $ani->id]);

        $this->deleteJson("/api/tasks/{$task->id}/assignees/{$ani->id}")->assertNoContent();
        $this->assertDatabaseMissing('task_user', ['task_id' => $task->id, 'user_id' => $ani->id]);
    }

    public function test_member_tidak_bisa_mengelola_assignee_tugas_orang_lain(): void
    {
        $member = User::factory()->create();
        $budi = User::factory()->create();
        $task = Task::factory()->create();
        $task->assignees()->attach($budi);

        $this->actingAs($member, 'sanctum');

        $this->postJson("/api/tasks/{$task->id}/assignees", ['user_id' => $member->id])
            ->assertStatus(403)
            ->assertJsonPath('message', 'Akses ditolak.');
        $this->deleteJson("/api/tasks/{$task->id}/assignees/{$budi->id}")->assertStatus(403);

        $this->assertDatabaseHas('task_user', ['task_id' => $task->id, 'user_id' => $budi->id]);
        $this->assertDatabaseMissing('task_user', ['task_id' => $task->id, 'user_id' => $member->id]);
    }

    public function test_admin_bisa_mengelola_assignee_tugas_siapa_pun(): void
    {
        $admin = User::factory()->admin()->create();
        $budi = User::factory()->create();
        $task = Task::factory()->create();

        $this->actingAs($admin, 'sanctum');

        $this->postJson("/api/tasks/{$task->id}/assignees", ['user_id' => $budi->id])->assertStatus(201);
        $this->deleteJson("/api/tasks/{$task->id}/assignees/{$budi->id}")->assertNoContent();

        $this->assertDatabaseCount('task_user', 0);
    }

    public function test_menghapus_user_yang_bukan_assignee_mengembalikan_404(): void
    {
        $creator = User::factory()->create();
        $budi = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $creator->id]);

        $this->actingAs($creator, 'sanctum')
            ->deleteJson("/api/tasks/{$task->id}/assignees/{$budi->id}")
            ->assertStatus(404)
            ->assertJsonPath('message', 'User bukan assignee tugas ini.');
    }

    public function test_tugas_atau_user_yang_tidak_ada_mengembalikan_404(): void
    {
        $creator = User::factory()->create();
        $budi = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $creator->id]);

        $this->actingAs($creator, 'sanctum');

        $this->postJson('/api/tasks/99999/assignees', ['user_id' => $budi->id])
            ->assertStatus(404)
            ->assertJsonPath('message', 'Data tidak ditemukan.');
        $this->deleteJson("/api/tasks/99999/assignees/{$budi->id}")->assertStatus(404);
        $this->deleteJson("/api/tasks/{$task->id}/assignees/99999")->assertStatus(404);
    }

    public function test_assignable_users_hanya_mengembalikan_id_dan_nama_urut_nama(): void
    {
        $budi = User::factory()->create(['name' => 'Budi']);
        $ani = User::factory()->admin()->create(['name' => 'Ani']);

        $this->actingAs($budi, 'sanctum')
            ->getJson('/api/assignable-users')
            ->assertStatus(200)
            ->assertExactJson(['data' => [
                ['id' => $ani->id, 'name' => 'Ani'],
                ['id' => $budi->id, 'name' => 'Budi'],
            ]]);
    }
}
