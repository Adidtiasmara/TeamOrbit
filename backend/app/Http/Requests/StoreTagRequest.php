<?php

namespace App\Http\Requests;

use App\Models\Tag;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class StoreTagRequest extends FormRequest
{
    private const NAME_MESSAGE = 'Nama tag wajib diisi, maksimal 50 karakter.';

    /**
     * Semua user yang login boleh membuat tag sesuai kebutuhan.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Spasi di awal/akhir sudah dipangkas middleware TrimStrings.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
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
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => self::NAME_MESSAGE,
            'name.string' => self::NAME_MESSAGE,
            'name.max' => self::NAME_MESSAGE,
        ];
    }
}
