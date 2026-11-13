<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssigneeRequest extends FormRequest
{
    /**
     * Dicek sebelum validasi, jadi user tanpa hak selalu mendapat 403
     * walaupun body yang dikirim tidak valid.
     */
    public function authorize(): bool
    {
        return $this->user()->can('manageAssignees', $this->task());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => [
                'bail',
                'required',
                'integer',
                'exists:users,id',
                Rule::unique('task_user', 'user_id')->where('task_id', $this->task()->id),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'User wajib dipilih.',
            'user_id.integer' => 'User tidak valid.',
            'user_id.exists' => 'User tidak ditemukan.',
            'user_id.unique' => 'User sudah menjadi assignee tugas ini.',
        ];
    }

    private function task(): Task
    {
        return $this->route('task');
    }
}
