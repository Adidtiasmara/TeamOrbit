<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTagRequest;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Daftar dan pembuatan tag. Semua user yang login boleh membuat tag
 * sesuai kebutuhan; memasang tag ke tugas diatur TaskTagController.
 */
class TagController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return TagResource::collection(Tag::query()->orderByRaw('LOWER(name)')->get());
    }

    public function store(StoreTagRequest $request): JsonResponse
    {
        return TagResource::make(Tag::create($request->validated()))
            ->response()
            ->setStatusCode(201);
    }
}
