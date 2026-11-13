<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends TaskRequest
{
    /**
     * Semua user yang login boleh membuat tugas.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Spasi di awal/akhir judul sudah dipangkas middleware TrimStrings,
     * jadi batas 100 karakter berlaku untuk judul setelah trim.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', Rule::in(Task::STATUSES)],
        ];
    }
}
