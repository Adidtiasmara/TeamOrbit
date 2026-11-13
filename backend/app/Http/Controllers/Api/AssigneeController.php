<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class AssigneeController extends Controller
{
    public function store(Request $request, Task $task): JsonResponse
    {
        Gate::authorize('manageAssignees', $task);

        $data = $request->validate([
            'user_id' => [
                'bail',
                'required',
                'integer',
                'exists:users,id',
                Rule::unique('task_user', 'user_id')->where('task_id', $task->id),
            ],
        ], [
            'user_id.required' => 'User wajib dipilih.',
            'user_id.integer' => 'User tidak valid.',
            'user_id.exists' => 'User tidak ditemukan.',
            'user_id.unique' => 'User sudah menjadi assignee tugas ini.',
        ]);

        $task->assignees()->attach($data['user_id']);

        return (new TaskResource($task->load(Task::RESOURCE_RELATIONS)))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Task $task, User $user): Response
    {
        Gate::authorize('manageAssignees', $task);

        if ($task->assignees()->detach($user->id) === 0) {
            return response()->json(['message' => 'User bukan assignee tugas ini.'], 404);
        }

        return response()->noContent();
    }
}
