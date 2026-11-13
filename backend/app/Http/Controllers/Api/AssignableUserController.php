<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AssignableUserController extends Controller
{
    /**
     * Daftar user untuk dropdown assignee, boleh diakses semua user yang login.
     * Hanya id dan nama; data lengkap user (email, role) tetap khusus Admin.
     */
    public function __invoke(): JsonResponse
    {
        $users = User::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name]);

        return response()->json(['data' => $users]);
    }
}
