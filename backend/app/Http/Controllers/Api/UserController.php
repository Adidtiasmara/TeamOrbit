<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserRoleRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

/**
 * Kelola user, khusus Admin (route memakai middleware role:admin).
 */
class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(User::query()->orderBy('name')->get());
    }

    public function updateRole(UpdateUserRoleRequest $request, User $user): UserResource
    {
        // Aturan bisnis, dicek setelah role terbukti valid: admin tidak boleh
        // mengubah role-nya sendiri, supaya selalu tersisa minimal satu admin
        // dan tidak ada yang mengunci dirinya keluar.
        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'role' => 'Kamu tidak bisa mengubah role akunmu sendiri.',
            ]);
        }

        $user->update(['role' => $request->validated('role')]);

        return new UserResource($user);
    }
}
