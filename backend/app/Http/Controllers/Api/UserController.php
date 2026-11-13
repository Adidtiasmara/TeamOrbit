<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Kelola user, khusus Admin (route memakai middleware role:admin).
 */
class UserController extends Controller
{
    private const FIELDS = ['id', 'name', 'email', 'role'];

    public function index(): JsonResponse
    {
        $users = User::query()
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => $user->only(self::FIELDS));

        return response()->json(['data' => $users]);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', Rule::in(['admin', 'member'])],
        ], [
            'role.required' => 'Role wajib dipilih.',
            'role.in' => 'Role harus admin atau member.',
        ]);

        // Admin tidak boleh mengubah role-nya sendiri, supaya selalu tersisa
        // minimal satu admin dan tidak ada yang mengunci dirinya keluar.
        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'role' => 'Kamu tidak bisa mengubah role akunmu sendiri.',
            ]);
        }

        $user->update(['role' => $data['role']]);

        return response()->json(['data' => $user->only(self::FIELDS)]);
    }
}
