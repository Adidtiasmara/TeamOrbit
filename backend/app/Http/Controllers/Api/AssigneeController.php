<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssigneeRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class AssigneeController extends Controller
{
    /**
     * Hak akses dan validasi ditangani StoreAssigneeRequest.
     */
    public function store(StoreAssigneeRequest $request, Task $task): JsonResponse
    {
        $task->assignees()->attach($request->validated('user_id'));

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
