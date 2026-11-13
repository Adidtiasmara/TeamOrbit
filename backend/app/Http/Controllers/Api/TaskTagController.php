<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Tag;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Memasang/melepas tag pada tugas. Aturan aksesnya sama dengan mengedit
 * tugas: Admin semua tugas, Member hanya tugas yang ia buat.
 */
class TaskTagController extends Controller
{
    public function store(Task $task, Tag $tag): JsonResponse
    {
        Gate::authorize('manageTags', $task);

        if ($task->tags()->whereKey($tag->id)->exists()) {
            throw ValidationException::withMessages([
                'tag_id' => 'Tag sudah terpasang di tugas ini.',
            ]);
        }

        $task->tags()->attach($tag->id);

        return (new TaskResource($task->load(Task::RESOURCE_RELATIONS)))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Task $task, Tag $tag): Response
    {
        Gate::authorize('manageTags', $task);

        if ($task->tags()->detach($tag->id) === 0) {
            return response()->json(['message' => 'Tag tidak terpasang di tugas ini.'], 404);
        }

        return response()->noContent();
    }
}
