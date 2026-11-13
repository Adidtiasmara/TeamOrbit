<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Daftar dan pembuatan tag. Semua user yang login boleh membuat tag
 * sesuai kebutuhan; memasang tag ke tugas diatur TaskTagController.
 */
class TagController extends Controller
{
    public function index(): JsonResponse
    {
        $tags = Tag::query()
            ->orderByRaw('LOWER(name)')
            ->get()
            ->map(fn (Tag $tag) => $tag->only(['id', 'name']));

        return response()->json(['data' => $tags]);
    }

    public function store(Request $request): JsonResponse
    {
        // Spasi di awal/akhir sudah dipangkas middleware TrimStrings.
        $data = $request->validate([
            'name' => [
                'bail',
                'required',
                'string',
                'max:50',
                // Unik tanpa membedakan huruf besar/kecil ("Urgent" = "urgent"),
                // sama di MySQL maupun SQLite.
                function (string $attribute, mixed $value, Closure $fail): void {
                    $exists = Tag::query()
                        ->whereRaw('LOWER(name) = ?', [mb_strtolower($value)])
                        ->exists();

                    if ($exists) {
                        $fail('Tag dengan nama ini sudah ada.');
                    }
                },
            ],
        ], [
            'name.required' => 'Nama tag wajib diisi, maksimal 50 karakter.',
            'name.string' => 'Nama tag wajib diisi, maksimal 50 karakter.',
            'name.max' => 'Nama tag wajib diisi, maksimal 50 karakter.',
        ]);

        $tag = Tag::create($data);

        return response()->json(['data' => $tag->only(['id', 'name'])], 201);
    }
}
