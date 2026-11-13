<?php

namespace Tests\Feature;

use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TagTest extends TestCase
{
    use RefreshDatabase;

    private const NAME_MESSAGE = 'Nama tag wajib diisi, maksimal 50 karakter.';

    public function test_endpoint_tag_menolak_request_tanpa_token(): void
    {
        $task = Task::factory()->create();
        $tag = Tag::factory()->create();

        $this->getJson('/api/tags')->assertStatus(401);
        $this->postJson('/api/tags', ['name' => 'urgent'])->assertStatus(401);
        $this->postJson("/api/tasks/{$task->id}/tags/{$tag->id}")->assertStatus(401);
        $this->deleteJson("/api/tasks/{$task->id}/tags/{$tag->id}")->assertStatus(401);

        $this->assertDatabaseCount('tags', 1);
        $this->assertDatabaseCount('task_tag', 0);
    }

    public function test_daftar_tag_urut_nama_dan_bisa_dilihat_member(): void
    {
        $member = User::factory()->create();
        $urgent = Tag::factory()->create(['name' => 'urgent']);
        $zebra = Tag::factory()->create(['name' => 'Zebra']);
        $desain = Tag::factory()->create(['name' => 'desain']);

        // Urutan tidak membedakan huruf besar/kecil: desain, urgent, Zebra.
        $this->actingAs($member, 'sanctum')
            ->getJson('/api/tags')
            ->assertStatus(200)
            ->assertExactJson(['data' => [
                ['id' => $desain->id, 'name' => 'desain'],
                ['id' => $urgent->id, 'name' => 'urgent'],
                ['id' => $zebra->id, 'name' => 'Zebra'],
            ]]);

        $this->getJson('/api/tags')->assertJsonPath('data.2.name', 'Zebra');
    }

    public function test_member_bisa_membuat_tag_baru(): void
    {
        $member = User::factory()->create();

        $this->actingAs($member, 'sanctum')
            ->postJson('/api/tags', ['name' => '  Laporan Bulanan  '])
            ->assertStatus(201)
            ->assertJsonPath('data.name', 'Laporan Bulanan')
            ->assertJsonStructure(['data' => ['id', 'name']]);

        $this->assertDatabaseHas('tags', ['name' => 'Laporan Bulanan']);
    }

    public function test_membuat_tag_hanya_mengembalikan_id_dan_nama(): void
    {
        $member = User::factory()->create();

        $response = $this->actingAs($member, 'sanctum')
            ->postJson('/api/tags', ['name' => 'urgent'])
            ->assertStatus(201);

        $response->assertExactJson(['data' => [
            'id' => Tag::where('name', 'urgent')->value('id'),
            'name' => 'urgent',
        ]]);
    }

    public function test_nama_tag_wajib_maksimal_50_dan_unik_tanpa_beda_huruf_besar(): void
    {
        $member = User::factory()->create();
        Tag::factory()->create(['name' => 'Urgent']);

        $this->actingAs($member, 'sanctum');

        $this->postJson('/api/tags', ['name' => '   '])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Validasi gagal.')
            ->assertJsonPath('errors.name.0', self::NAME_MESSAGE);

        $this->postJson('/api/tags', ['name' => str_repeat('a', 51)])
            ->assertStatus(422)
            ->assertJsonPath('errors.name.0', self::NAME_MESSAGE);

        $this->postJson('/api/tags', ['name' => 'urgent'])
            ->assertStatus(422)
            ->assertJsonPath('errors.name.0', 'Tag dengan nama ini sudah ada.');

        $this->postJson('/api/tags', ['name' => str_repeat('b', 50)])->assertStatus(201);

        $this->assertDatabaseCount('tags', 2);
    }

    public function test_pembuat_bisa_memasang_tag_dan_mendapat_data_tugas_terbaru(): void
    {
        $creator = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $creator->id]);
        $urgent = Tag::factory()->create(['name' => 'urgent']);
        $zebra = Tag::factory()->create(['name' => 'Zebra']);
        $desain = Tag::factory()->create(['name' => 'desain']);
        $task->tags()->attach([$urgent->id, $zebra->id]);

        $this->actingAs($creator, 'sanctum')
            ->postJson("/api/tasks/{$task->id}/tags/{$desain->id}")
            ->assertStatus(201)
            ->assertJsonPath('data.id', $task->id)
            ->assertJsonPath('data.tags', [
                ['id' => $desain->id, 'name' => 'desain'],
                ['id' => $urgent->id, 'name' => 'urgent'],
                ['id' => $zebra->id, 'name' => 'Zebra'],
            ]);

        $this->assertDatabaseHas('task_tag', ['task_id' => $task->id, 'tag_id' => $desain->id]);
    }

    public function test_tag_yang_sudah_terpasang_ditolak_422(): void
    {
        $creator = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $creator->id]);
        $tag = Tag::factory()->create();
        $task->tags()->attach($tag);

        $this->actingAs($creator, 'sanctum')
            ->postJson("/api/tasks/{$task->id}/tags/{$tag->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Validasi gagal.')
            ->assertJsonPath('errors.tag_id.0', 'Tag sudah terpasang di tugas ini.');

        $this->assertDatabaseCount('task_tag', 1);
    }

    public function test_assignee_bisa_memasang_dan_melepas_tag(): void
    {
        $assignee = User::factory()->create();
        $task = Task::factory()->create();
        $task->assignees()->attach($assignee);
        $tag = Tag::factory()->create();

        $this->actingAs($assignee, 'sanctum');

        $this->postJson("/api/tasks/{$task->id}/tags/{$tag->id}")->assertStatus(201);
        $this->deleteJson("/api/tasks/{$task->id}/tags/{$tag->id}")->assertNoContent();

        $this->assertDatabaseCount('task_tag', 0);
    }

    public function test_member_tidak_bisa_mengelola_tag_tugas_orang_lain(): void
    {
        $member = User::factory()->create();
        $task = Task::factory()->create();
        $attached = Tag::factory()->create();
        $other = Tag::factory()->create();
        $task->tags()->attach($attached);

        $this->actingAs($member, 'sanctum');

        $this->postJson("/api/tasks/{$task->id}/tags/{$other->id}")
            ->assertStatus(403)
            ->assertJsonPath('message', 'Akses ditolak.');
        $this->deleteJson("/api/tasks/{$task->id}/tags/{$attached->id}")->assertStatus(403);

        $this->assertDatabaseHas('task_tag', ['task_id' => $task->id, 'tag_id' => $attached->id]);
        $this->assertDatabaseMissing('task_tag', ['task_id' => $task->id, 'tag_id' => $other->id]);
    }

    public function test_admin_bisa_mengelola_tag_tugas_siapa_pun(): void
    {
        $admin = User::factory()->admin()->create();
        $task = Task::factory()->create();
        $tag = Tag::factory()->create();

        $this->actingAs($admin, 'sanctum');

        $this->postJson("/api/tasks/{$task->id}/tags/{$tag->id}")->assertStatus(201);
        $this->deleteJson("/api/tasks/{$task->id}/tags/{$tag->id}")->assertNoContent();

        $this->assertDatabaseCount('task_tag', 0);
    }

    public function test_melepas_tag_yang_tidak_terpasang_mengembalikan_404(): void
    {
        $creator = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $creator->id]);
        $tag = Tag::factory()->create();

        $this->actingAs($creator, 'sanctum')
            ->deleteJson("/api/tasks/{$task->id}/tags/{$tag->id}")
            ->assertStatus(404)
            ->assertJsonPath('message', 'Tag tidak terpasang di tugas ini.');
    }

    public function test_tugas_atau_tag_yang_tidak_ada_mengembalikan_404(): void
    {
        $creator = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $creator->id]);
        $tag = Tag::factory()->create();

        $this->actingAs($creator, 'sanctum');

        $this->postJson("/api/tasks/99999/tags/{$tag->id}")
            ->assertStatus(404)
            ->assertJsonPath('message', 'Data tidak ditemukan.');
        $this->postJson("/api/tasks/{$task->id}/tags/99999")->assertStatus(404);
        $this->deleteJson("/api/tasks/{$task->id}/tags/99999")->assertStatus(404);
    }

    public function test_tag_tampil_di_daftar_dan_detail_tugas(): void
    {
        $creator = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $creator->id]);
        $tag = Tag::factory()->create(['name' => 'urgent']);
        $task->tags()->attach($tag);
        Task::factory()->create(['created_by' => $creator->id]);

        $this->actingAs($creator, 'sanctum');

        $list = $this->getJson('/api/tasks')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'tags']]]);

        $tagsById = collect($list->json('data'))->pluck('tags', 'id');
        $this->assertSame([['id' => $tag->id, 'name' => 'urgent']], $tagsById[$task->id]);

        $this->getJson("/api/tasks/{$task->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.tags', [['id' => $tag->id, 'name' => 'urgent']]);
    }

    public function test_menghapus_tugas_ikut_melepas_tag_tapi_tag_tetap_ada(): void
    {
        $creator = User::factory()->create();
        $task = Task::factory()->create(['created_by' => $creator->id]);
        $tag = Tag::factory()->create();
        $task->tags()->attach($tag);

        $this->actingAs($creator, 'sanctum')
            ->deleteJson("/api/tasks/{$task->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('task_tag', ['task_id' => $task->id]);
        $this->assertDatabaseHas('tags', ['id' => $tag->id]);
    }
}
