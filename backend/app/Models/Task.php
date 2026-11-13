<?php

namespace App\Models;

use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    public const STATUS_PENDING = 'belum_selesai';

    public const STATUS_DONE = 'selesai';

    public const STATUSES = [self::STATUS_PENDING, self::STATUS_DONE];

    /**
     * created_by sengaja tidak fillable; diisi dari user yang login.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'description',
        'status',
    ];

    /**
     * Sama dengan default kolom di DB, supaya model yang baru dibuat
     * langsung punya status tanpa perlu di-refresh.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => self::STATUS_PENDING,
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_user');
    }

    /**
     * Satu-satunya definisi aturan akses tugas (design/RBAC.md):
     * Admin melihat semua tugas, Member hanya tugas yang ia buat
     * atau yang ditugaskan kepadanya.
     *
     * @param  Builder<Task>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if ($user->isAdmin()) {
            return;
        }

        $query->where(function (Builder $query) use ($user): void {
            $query->where('created_by', $user->id)
                ->orWhereHas('assignees', fn (Builder $assignees) => $assignees->whereKey($user->id));
        });
    }

    public function isAccessibleBy(User $user): bool
    {
        return static::query()->visibleTo($user)->whereKey($this->getKey())->exists();
    }
}
