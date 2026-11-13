<?php

use App\Http\Controllers\Api\AssignableUserController;
use App\Http\Controllers\Api\AssigneeController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('tasks', TaskController::class);
    Route::post('/tasks/{task}/assignees', [AssigneeController::class, 'store']);
    Route::delete('/tasks/{task}/assignees/{user}', [AssigneeController::class, 'destroy']);

    Route::get('/assignable-users', AssignableUserController::class);

    Route::middleware('role:admin')->group(function (): void {
        Route::get('/users', [UserController::class, 'index']);
        Route::put('/users/{user}/role', [UserController::class, 'updateRole']);
    });

    // Fase 6: /tags
});
