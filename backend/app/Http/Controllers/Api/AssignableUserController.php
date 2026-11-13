<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserSummaryResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AssignableUserController extends Controller
{
    /**
     * Daftar user untuk dropdown assignee, boleh diakses semua user yang login.
     * Hanya id dan nama; data lengkap user (email, role) tetap khusus Admin.
     */
    public function __invoke(): AnonymousResourceCollection
    {
        return UserSummaryResource::collection(
            User::query()->orderBy('name')->get(['id', 'name']),
        );
    }
}
