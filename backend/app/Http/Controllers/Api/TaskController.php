<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListTasksRequest;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    public function index(ListTasksRequest $request): AnonymousResourceCollection
    {
        $tasks = Task::query()
            ->visibleTo($request->user())
            ->when(
                $request->validated('status'),
                fn (Builder $query, string $status) => $query->where('status', $status),
            )
            ->with(Task::RESOURCE_RELATIONS)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return TaskResource::collection($tasks);
    }

    /**
     * Statistik tugas yang terlihat oleh user: Admin seluruh tugas tim,
     * Member hanya tugas yang ia buat atau ditugaskan kepadanya.
     */
    public function summary(Request $request): JsonResponse
    {
        $visible = fn () => Task::query()->visibleTo($request->user());

        $total = $visible()->count();
        $done = $visible()->where('status', Task::STATUS_DONE)->count();

        return response()->json(['data' => [
            'total' => $total,
            'done' => $done,
            'pending' => $total - $done,
            'overdue' => $visible()->overdue()->count(),
            'percent_done' => $total === 0 ? 0 : (int) round($done / $total * 100),
        ]]);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $request->user()->createdTasks()->create($request->validated());

        return (new TaskResource($task->load(Task::RESOURCE_RELATIONS)))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Task $task): TaskResource
    {
        Gate::authorize('view', $task);

        return new TaskResource($task->load(Task::RESOURCE_RELATIONS));
    }

    /**
     * Hak akses dan validasi parsial ditangani UpdateTaskRequest.
     */
    public function update(UpdateTaskRequest $request, Task $task): TaskResource
    {
        $task->update($request->validated());

        return new TaskResource($task->load(Task::RESOURCE_RELATIONS));
    }

    public function destroy(Task $task): Response
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return response()->noContent();
    }
}
