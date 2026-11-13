<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    private const TITLE_MESSAGE = 'Judul wajib diisi, maksimal 100 karakter.';

    private const STATUS_MESSAGE = 'Status harus belum_selesai atau selesai.';

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(Task::STATUSES)],
        ], [
            'status.in' => self::STATUS_MESSAGE,
        ]);

        $tasks = Task::query()
            ->visibleTo($request->user())
            ->when(
                $filters['status'] ?? null,
                fn (Builder $query, string $status) => $query->where('status', $status),
            )
            ->with(['creator', 'assignees'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return TaskResource::collection($tasks);
    }

    public function store(Request $request): JsonResponse
    {
        // Spasi di awal/akhir judul sudah dipangkas middleware TrimStrings,
        // jadi batas 100 karakter berlaku untuk judul setelah trim.
        $data = $request->validate([
            'title' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', Rule::in(Task::STATUSES)],
        ], $this->messages());

        $task = $request->user()->createdTasks()->create($data);

        return (new TaskResource($task->load(['creator', 'assignees'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Task $task): TaskResource
    {
        Gate::authorize('view', $task);

        return new TaskResource($task->load(['creator', 'assignees']));
    }

    /**
     * Update parsial: hanya field yang dikirim yang divalidasi dan diubah,
     * jadi toggle status cukup mengirim {"status": "selesai"}.
     */
    public function update(Request $request, Task $task): TaskResource
    {
        Gate::authorize('update', $task);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'required', Rule::in(Task::STATUSES)],
        ], $this->messages());

        $task->update($data);

        return new TaskResource($task->load(['creator', 'assignees']));
    }

    public function destroy(Task $task): Response
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, string>
     */
    private function messages(): array
    {
        return [
            'title.required' => self::TITLE_MESSAGE,
            'title.string' => self::TITLE_MESSAGE,
            'title.max' => self::TITLE_MESSAGE,
            'description.string' => 'Deskripsi harus berupa teks.',
            'status.required' => self::STATUS_MESSAGE,
            'status.in' => self::STATUS_MESSAGE,
        ];
    }
}
