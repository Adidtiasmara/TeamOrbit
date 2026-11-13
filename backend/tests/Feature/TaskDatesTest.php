<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TaskDatesTest extends TestCase
{
    use RefreshDatabase;

    private const DUE_MESSAGE = 'Deadline tidak boleh sebelum tanggal mulai.';

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_tugas_bisa_dibuat_dengan_tanggal_mulai_dan_deadline(): void
    {
        $member = User::factory()->create();

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/tasks', [
                'title' => 'Rapat evaluasi',
                'start_date' => '2026-11-20',
                'due_date' => '2026-11-25',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.start_date', '2026-11-20')
            ->assertJsonPath('data.due_date', '2026-11-25');

        $this->assertDatabaseHas('tasks', ['title' => 'Rapat evaluasi']);
        $this->assertSame('2026-11-25', Task::first()->due_date->toDateString());
    }

    public function test_tanggal_opsional_dan_bernilai_null_jika_kosong(): void
    {
        $member = User::factory()->create();

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/tasks', ['title' => 'Tanpa tanggal', 'start_date' => '', 'due_date' => null])
            ->assertStatus(201)
            ->assertJsonPath('data.start_date', null)
            ->assertJsonPath('data.due_date', null)
            ->assertJsonPath('data.is_overdue', false);
    }

    public function test_deadline_sebelum_tanggal_mulai_ditolak(): void
    {
        $member = User::factory()->create();

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/tasks', [
                'title' => 'Salah tanggal',
                'start_date' => '2026-11-25',
                'due_date' => '2026-11-20',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Validasi gagal.')
            ->assertJsonPath('errors.due_date.0', self::DUE_MESSAGE);

        $this->postJson('/api/tasks', [
            'title' => 'Hari yang sama',
            'start_date' => '2026-11-20',
            'due_date' => '2026-11-20',
        ])->assertStatus(201);

        $this->assertDatabaseCount('tasks', 1);
    }

    public function test_format_tanggal_tidak_valid_ditolak(): void
    {
        $member = User::factory()->create();

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/tasks', ['title' => 'Format salah', 'start_date' => '20-11-2026', 'due_date' => 'besok'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['start_date', 'due_date']);

        $this->assertDatabaseCount('tasks', 0);
    }

    public function test_update_parsial_membandingkan_dengan_tanggal_yang_tersimpan(): void
    {
        $member = User::factory()->create();
        $task = Task::factory()->create([
            'created_by' => $member->id,
            'start_date' => '2026-11-20',
            'due_date' => '2026-11-25',
        ]);

        $this->actingAs($member, 'sanctum');

        $this->putJson("/api/tasks/{$task->id}", ['due_date' => '2026-11-19'])
            ->assertStatus(422)
            ->assertJsonPath('errors.due_date.0', self::DUE_MESSAGE);

        $this->putJson("/api/tasks/{$task->id}", ['start_date' => '2026-11-26'])
            ->assertStatus(422)
            ->assertJsonPath('errors.due_date.0', self::DUE_MESSAGE);

        $this->putJson("/api/tasks/{$task->id}", ['status' => 'selesai'])
            ->assertStatus(200)
            ->assertJsonPath('data.start_date', '2026-11-20')
            ->assertJsonPath('data.due_date', '2026-11-25');

        $this->putJson("/api/tasks/{$task->id}", ['due_date' => null])
            ->assertStatus(200)
            ->assertJsonPath('data.due_date', null);
    }

    public function test_tugas_belum_selesai_yang_lewat_deadline_ditandai_terlambat(): void
    {
        Carbon::setTestNow('2026-11-20 10:00:00');
        $member = User::factory()->create();
        $late = Task::factory()->create(['created_by' => $member->id, 'due_date' => '2026-11-19']);
        $today = Task::factory()->create(['created_by' => $member->id, 'due_date' => '2026-11-20']);
        $doneLate = Task::factory()->done()->create(['created_by' => $member->id, 'due_date' => '2026-11-01']);

        $this->actingAs($member, 'sanctum');

        $this->getJson("/api/tasks/{$late->id}")->assertJsonPath('data.is_overdue', true);
        $this->getJson("/api/tasks/{$today->id}")->assertJsonPath('data.is_overdue', false);
        $this->getJson("/api/tasks/{$doneLate->id}")->assertJsonPath('data.is_overdue', false);
    }

    public function test_hari_ini_mengikuti_zona_waktu_tim_bukan_utc(): void
    {
        // 20 Nov 18:00 UTC = 21 Nov 01:00 WIB, jadi deadline 20 Nov sudah lewat.
        Carbon::setTestNow(Carbon::parse('2026-11-20 18:00:00', 'UTC'));
        $member = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $member->id, 'due_date' => '2026-11-20']);

        $this->actingAs($member, 'sanctum')
            ->getJson("/api/tasks/{$task->id}")
            ->assertJsonPath('data.is_overdue', true);
    }

    public function test_ringkasan_admin_menghitung_seluruh_tugas_tim(): void
    {
        Carbon::setTestNow('2026-11-20 10:00:00');
        $admin = User::factory()->admin()->create();
        Task::factory()->count(2)->done()->create();
        Task::factory()->create(['due_date' => '2026-11-10']);
        Task::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/tasks/summary')
            ->assertStatus(200)
            ->assertExactJson(['data' => [
                'total' => 4,
                'done' => 2,
                'pending' => 2,
                'overdue' => 1,
                'percent_done' => 50,
            ]]);
    }

    public function test_ringkasan_member_hanya_tugas_milik_atau_ditugaskan(): void
    {
        $member = User::factory()->create();
        Task::factory()->done()->create(['created_by' => $member->id]);
        Task::factory()->create()->assignees()->attach($member);
        Task::factory()->count(3)->create();

        $this->actingAs($member, 'sanctum')
            ->getJson('/api/tasks/summary')
            ->assertStatus(200)
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.done', 1)
            ->assertJsonPath('data.percent_done', 50);
    }

    public function test_ringkasan_kosong_dan_wajib_login(): void
    {
        $this->getJson('/api/tasks/summary')->assertStatus(401);

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/tasks/summary')
            ->assertExactJson(['data' => [
                'total' => 0,
                'done' => 0,
                'pending' => 0,
                'overdue' => 0,
                'percent_done' => 0,
            ]]);
    }
}
