<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends TaskRequest
{
    /**
     * Dicek sebelum validasi, jadi user tanpa hak selalu mendapat 403
     * walaupun body yang dikirim tidak valid. Assignee hanya boleh
     * mengirim status; field lain butuh hak edit penuh.
     */
    public function authorize(): bool
    {
        $ability = array_diff($this->keys(), ['status']) === [] ? 'updateStatus' : 'update';

        return $this->user()->can($ability, $this->route('task'));
    }

    /**
     * Update parsial: hanya field yang dikirim yang divalidasi dan diubah,
     * jadi toggle status cukup mengirim {"status": "selesai"}.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'required', Rule::in(Task::STATUSES)],
            ...$this->dateRules(),
        ];
    }

    protected function existingTask(): ?Task
    {
        return $this->route('task');
    }
}
