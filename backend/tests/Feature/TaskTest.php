<?php

namespace Tests\Feature;

use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    private const TITLE_MESSAGE = 'Judul wajib diisi, maksimal 100 karakter.';

    public function test_endpoint_tugas_menolak_request_tanpa_token(): void
    {
        $task = Task::factory()->create();

        $this->getJson('/api/tasks')
            ->assertStatus(401)
            ->assertJsonPath('message', 'Belum login atau token tidak valid.');
        $this->postJson('/api/tasks', ['title' => 'Tugas baru'])->assertStatus(401);
        $this->getJson("/api/tasks/{$task->id}")->assertStatus(401);
        $this->putJson("/api/tasks/{$task->id}", ['status' => 'selesai'])->assertStatus(401);
        $this->deleteJson("/api/tasks/{$task->id}")->assertStatus(401);

        // Tanpa header Accept: application/json tetap dijawab JSON 401, bukan redirect/500.
        $this->get('/api/tasks')
            ->assertStatus(401)
            ->assertJsonPath('message', 'Belum login atau token tidak valid.');

        $this->assertDatabaseCount('tasks', 1);
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'status' => 'belum_selesai']);
    }

    public function test_member_hanya_melihat_tugas_yang_ia_buat_atau_ditugaskan(): void
    {
        $member = User::factory()->create();
        $other = User::factory()->create();

        $own = Task::factory()->create(['created_by' => $member->id]);
        $assigned = Task::factory()->create(['created_by' => $other->id]);
        $assigned->assignees()->attach($member);
        $hidden = Task::factory()->create(['created_by' => $other->id]);

        $response = $this->actingAs($member, 'sanctum')
            ->getJson('/api/tasks')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');

        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertEqualsCanonicalizing([$own->id, $assigned->id], $ids);
        $this->assertNotContains($hidden->id, $ids);
    }

    public function test_admin_melihat_semua_tugas(): void
    {
        $admin = User::factory()->admin()->create();
        Task::factory()->count(3)->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/tasks')
            ->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_daftar_tugas_memakai_format_api_spec(): void
    {
        $member = User::factory()->create(['name' => 'Budi']);
        $ani = User::factory()->create(['name' => 'Ani']);
        $task = Task::factory()->create(['created_by' => $member->id]);
        $task->assignees()->attach($ani);

        $this->actingAs($member, 'sanctum')
            ->getJson('/api/tasks')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [[
                'id', 'title', 'description', 'status',
                'created_by' => ['id', 'name'],
                'assignees' => [['id', 'name']],
                'created_at', 'updated_at',
            ]]])
            ->assertJsonPath('data.0.created_by', ['id' => $member->id, 'name' => 'Budi'])
            ->assertJsonPath('data.0.assignees', [['id' => $ani->id, 'name' => 'Ani']]);
    }

    public function test_filter_status_hanya_mengembalikan_tugas_dengan_status_tersebut(): void
    {
        $member = User::factory()->create();
        $pending = Task::factory()->create(['created_by' => $member->id]);
        $done = Task::factory()->done()->create(['created_by' => $member->id]);

        $this->actingAs($member, 'sanctum');

        $this->getJson('/api/tasks?status=selesai')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $done->id);

        $this->getJson('/api/tasks?status=belum_selesai')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $pending->id);

        $this->getJson('/api/tasks')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_filter_status_tidak_valid_ditolak(): void
    {
        $member = User::factory()->create();

        $this->actingAs($member, 'sanctum')
            ->getJson('/api/tasks?status=proses')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Validasi gagal.')
            ->assertJsonValidationErrors(['status']);
    }

    public function test_membuat_tugas_mengembalikan_201_dan_pembuat_tidak_otomatis_jadi_assignee(): void
    {
        $member = User::factory()->create();

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/tasks', [
                'title' => 'Siapkan laporan mingguan',
                'description' => 'Rangkum progres tim.',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.title', 'Siapkan laporan mingguan')
            ->assertJsonPath('data.description', 'Rangkum progres tim.')
            ->assertJsonPath('data.status', 'belum_selesai')
            ->assertJsonPath('data.created_by.id', $member->id)
            ->assertJsonPath('data.assignees', []);

        $this->assertDatabaseHas('tasks', [
            'title' => 'Siapkan laporan mingguan',
            'created_by' => $member->id,
            'status' => 'belum_selesai',
        ]);
        $this->assertDatabaseCount('task_user', 0);
    }

    public function test_judul_wajib_diisi(): void
    {
        $member = User::factory()->create();

        $this->actingAs($member, 'sanctum');

        $this->postJson('/api/tasks', ['description' => 'Tanpa judul'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Validasi gagal.')
            ->assertJsonPath('errors.title.0', self::TITLE_MESSAGE);

        // Judul yang isinya spasi saja dianggap kosong setelah di-trim.
        $this->postJson('/api/tasks', ['title' => '     '])
            ->assertStatus(422)
            ->assertJsonPath('errors.title.0', self::TITLE_MESSAGE);

        $this->assertDatabaseCount('tasks', 0);
    }

    public function test_judul_maksimal_100_karakter_setelah_trim(): void
    {
        $member = User::factory()->create();

        $this->actingAs($member, 'sanctum');

        $this->postJson('/api/tasks', ['title' => str_repeat('a', 101)])
            ->assertStatus(422)
            ->assertJsonPath('errors.title.0', self::TITLE_MESSAGE);

        $title = str_repeat('b', 100);

        $this->postJson('/api/tasks', ['title' => "   {$title}   "])
            ->assertStatus(201)
            ->assertJsonPath('data.title', $title);

        $this->assertDatabaseCount('tasks', 1);
        $this->assertDatabaseHas('tasks', ['title' => $title]);
    }

    public function test_status_tidak_valid_ditolak_saat_membuat_tugas(): void
    {
        $member = User::factory()->create();

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/tasks', ['title' => 'Tugas', 'status' => 'proses'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);

        $this->assertDatabaseCount('tasks', 0);
    }

    public function test_member_tidak_bisa_mengakses_tugas_orang_lain(): void
    {
        $member = User::factory()->create();
        $task = Task::factory()->create(['title' => 'Milik orang lain']);

        $this->actingAs($member, 'sanctum');

        $this->getJson("/api/tasks/{$task->id}")
            ->assertStatus(403)
            ->assertJsonPath('message', 'Akses ditolak.');
        $this->putJson("/api/tasks/{$task->id}", ['title' => 'Diubah'])->assertStatus(403);
        // Hak akses dicek sebelum validasi, jadi data tidak valid pun tetap 403.
        $this->putJson("/api/tasks/{$task->id}", ['title' => ''])->assertStatus(403);
        $this->deleteJson("/api/tasks/{$task->id}")->assertStatus(403);

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'title' => 'Milik orang lain']);
    }

    public function test_assignee_bisa_melihat_dan_mengubah_tugas(): void
    {
        $member = User::factory()->create();
        $task = Task::factory()->create();
        $task->assignees()->attach($member);

        $this->actingAs($member, 'sanctum');

        $this->getJson("/api/tasks/{$task->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $task->id)
            ->assertJsonPath('data.assignees.0.id', $member->id);

        $this->putJson("/api/tasks/{$task->id}", ['status' => 'selesai'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'selesai');
    }

    public function test_update_parsial_hanya_mengubah_field_yang_dikirim(): void
    {
        $member = User::factory()->create();
        $task = Task::factory()->create([
            'created_by' => $member->id,
            'title' => 'Judul awal',
            'description' => 'Deskripsi awal',
        ]);

        $this->actingAs($member, 'sanctum')
            ->putJson("/api/tasks/{$task->id}", ['status' => 'selesai'])
            ->assertStatus(200)
            ->assertJsonPath('data.title', 'Judul awal')
            ->assertJsonPath('data.description', 'Deskripsi awal')
            ->assertJsonPath('data.status', 'selesai');

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Judul awal',
            'description' => 'Deskripsi awal',
            'status' => 'selesai',
        ]);
    }

    public function test_update_tetap_memvalidasi_judul_jika_dikirim(): void
    {
        $member = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $member->id, 'title' => 'Judul awal']);

        $this->actingAs($member, 'sanctum');

        $this->putJson("/api/tasks/{$task->id}", ['title' => '   '])
            ->assertStatus(422)
            ->assertJsonPath('errors.title.0', self::TITLE_MESSAGE);

        $this->putJson("/api/tasks/{$task->id}", ['title' => str_repeat('a', 101)])
            ->assertStatus(422)
            ->assertJsonPath('errors.title.0', self::TITLE_MESSAGE);

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'title' => 'Judul awal']);
    }

    public function test_pembuat_bisa_menghapus_tugas_dan_assignee_ikut_terhapus(): void
    {
        $member = User::factory()->create();
        $other = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $member->id]);
        $task->assignees()->attach($other);

        $this->actingAs($member, 'sanctum')
            ->deleteJson("/api/tasks/{$task->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
        $this->assertDatabaseMissing('task_user', ['task_id' => $task->id]);
    }

    public function test_admin_bisa_melihat_mengubah_dan_menghapus_tugas_siapa_pun(): void
    {
        $admin = User::factory()->admin()->create();
        $task = Task::factory()->create();

        $this->actingAs($admin, 'sanctum');

        $this->getJson("/api/tasks/{$task->id}")->assertStatus(200);
        $this->putJson("/api/tasks/{$task->id}", ['title' => 'Diubah admin'])
            ->assertStatus(200)
            ->assertJsonPath('data.title', 'Diubah admin');
        $this->deleteJson("/api/tasks/{$task->id}")->assertNoContent();

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_tugas_yang_tidak_ada_mengembalikan_404(): void
    {
        $member = User::factory()->create();

        $this->actingAs($member, 'sanctum');

        $this->getJson('/api/tasks/99999')
            ->assertStatus(404)
            ->assertJsonPath('message', 'Data tidak ditemukan.');
        $this->putJson('/api/tasks/99999', ['status' => 'selesai'])->assertStatus(404);
        $this->deleteJson('/api/tasks/99999')->assertStatus(404);
    }

    public function test_tugas_tetap_ada_saat_akun_pembuatnya_dihapus(): void
    {
        $admin = User::factory()->admin()->create();
        $creator = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $creator->id]);

        $creator->delete();

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/tasks/{$task->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.created_by', null);
    }

    public function test_objek_tugas_hanya_berisi_field_api_spec(): void
    {
        $member = User::factory()->create();
        $ani = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $member->id]);
        $task->assignees()->attach($ani);
        $task->tags()->attach(Tag::factory()->create());

        $this->actingAs($member, 'sanctum');

        $responses = [
            'index' => [$this->getJson('/api/tasks')->assertStatus(200), 'data.0'],
            'show' => [$this->getJson("/api/tasks/{$task->id}")->assertStatus(200), 'data'],
            'store' => [$this->postJson('/api/tasks', ['title' => 'Baru'])->assertStatus(201), 'data'],
        ];

        foreach ($responses as $name => [$response, $path]) {
            $this->assertSame(['data'], array_keys($response->json()), $name);
            $this->assertSame(
                ['id', 'title', 'description', 'status', 'start_date', 'due_date', 'is_overdue', 'created_by', 'assignees', 'tags', 'created_at', 'updated_at'],
                array_keys($response->json($path)),
                $name,
            );
            $this->assertSame(['id', 'name'], array_keys($response->json("{$path}.created_by")), $name);
        }

        $show = $responses['show'][0];
        $this->assertSame(['id', 'name'], array_keys($show->json('data.assignees.0')));
        $this->assertSame(['id', 'name'], array_keys($show->json('data.tags.0')));
        $this->assertSame([], $responses['store'][0]->json('data.assignees'));
        $this->assertSame([], $responses['store'][0]->json('data.tags'));
    }
}
