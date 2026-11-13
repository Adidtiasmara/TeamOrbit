<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Pesan validasi bersama untuk membuat, mengubah, dan memfilter tugas.
 */
abstract class TaskRequest extends FormRequest
{
    public const TITLE_MESSAGE = 'Judul wajib diisi, maksimal 100 karakter.';

    public const STATUS_MESSAGE = 'Status harus belum_selesai atau selesai.';

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => self::TITLE_MESSAGE,
            'title.string' => self::TITLE_MESSAGE,
            'title.max' => self::TITLE_MESSAGE,
            'description.string' => 'Deskripsi harus berupa teks.',
            'status.required' => self::STATUS_MESSAGE,
            'status.in' => self::STATUS_MESSAGE,
        ];
    }
}
