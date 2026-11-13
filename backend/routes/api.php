<?php

use App\Http\Controllers\Api\AssignableUserController;
use App\Http\Controllers\Api\AssigneeController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TaskTagController;
use App\Http\Controllers\Api\UserController;
use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Harus sebelum apiResource supaya "summary" tidak dianggap {task}.
    Route::get('/tasks/summary', [TaskController::class, 'summary']);
    Route::apiResource('tasks', TaskController::class);
    Route::post('/tasks/{task}/assignees', [AssigneeController::class, 'store']);
    Route::delete('/tasks/{task}/assignees/{user}', [AssigneeController::class, 'destroy']);

    Route::get('/assignable-users', AssignableUserController::class);

    Route::get('/tags', [TagController::class, 'index']);
    Route::post('/tags', [TagController::class, 'store']);
    Route::post('/tasks/{task}/tags/{tag}', [TaskTagController::class, 'store']);
    Route::delete('/tasks/{task}/tags/{tag}', [TaskTagController::class, 'destroy']);

    Route::middleware('role:'.User::ROLE_ADMIN)->group(function (): void {
        Route::get('/users', [UserController::class, 'index']);
        Route::put('/users/{user}/role', [UserController::class, 'updateRole']);
    });
});
