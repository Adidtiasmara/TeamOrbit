<?php

namespace App\Models;

use Database\Factories\TagFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    /** @use HasFactory<TagFactory> */
    use HasFactory;

    public const DEFAULT_COLOR = 'abu';

    /** Palet warna tag (design/API_SPEC.md). */
    public const COLORS = ['abu', 'merah', 'oranye', 'kuning', 'hijau', 'biru', 'ungu', 'merah_muda'];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'color',
    ];

    /**
     * Sama dengan default kolom, supaya tag yang baru dibuat langsung
     * punya warna tanpa perlu di-refresh.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'color' => self::DEFAULT_COLOR,
    ];

    /**
     * @return BelongsToMany<Task, $this>
     */
    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_tag');
    }
}
