<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Aturan dan pesan bersama untuk membuat dan mengubah tugas.
 */
abstract class TaskRequest extends FormRequest
{
    public const TITLE_MESSAGE = 'Judul wajib diisi, maksimal 100 karakter.';

    public const STATUS_MESSAGE = 'Status harus belum_selesai atau selesai.';

    public const DATE_MESSAGE = 'Tanggal tidak valid, gunakan format YYYY-MM-DD.';

    public const DUE_BEFORE_START_MESSAGE = 'Deadline tidak boleh sebelum tanggal mulai.';

    /**
     * Tugas yang sedang diubah; null saat membuat tugas baru.
     */
    protected function existingTask(): ?Task
    {
        return null;
    }

    /**
     * @return array<string, mixed>
     */
    protected function dateRules(): array
    {
        $prefix = $this->existingTask() ? ['sometimes'] : [];

        return [
            'start_date' => [...$prefix, 'nullable', 'date_format:Y-m-d'],
            'due_date' => [...$prefix, 'nullable', 'date_format:Y-m-d'],
        ];
    }

    /**
     * Deadline dibandingkan dengan tanggal mulai yang berlaku setelah
     * perubahan, termasuk saat hanya salah satu tanggal yang dikirim.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $errors = $validator->errors();

                if ($errors->has('start_date') || $errors->has('due_date')) {
                    return;
                }

                $start = $this->effectiveDate('start_date');
                $due = $this->effectiveDate('due_date');

                if ($start !== null && $due !== null && $due < $start) {
                    $errors->add('due_date', self::DUE_BEFORE_START_MESSAGE);
                }
            },
        ];
    }

    private function effectiveDate(string $field): ?string
    {
        if ($this->exists($field)) {
            return $this->input($field);
        }

        return $this->existingTask()?->{$field}?->toDateString();
    }

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
            'start_date.date_format' => self::DATE_MESSAGE,
            'due_date.date_format' => self::DATE_MESSAGE,
        ];
    }
}
