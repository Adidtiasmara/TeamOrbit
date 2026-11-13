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
     * Relasi yang selalu dimuat sebelum tugas dikirim lewat TaskResource.
     */
    public const RESOURCE_RELATIONS = ['creator', 'assignees', 'tags'];

    /**
     * created_by sengaja tidak fillable; diisi dari user yang login.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'description',
        'status',
        'start_date',
        'due_date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'due_date' => 'date',
        ];
    }

    /**
     * Tanggal hari ini menurut zona waktu tim (bukan UTC), dipakai untuk
     * menentukan tugas yang terlambat.
     */
    public static function today(): string
    {
        return now(config('app.task_timezone'))->toDateString();
    }

    public function isOverdue(): bool
    {
        return $this->status !== self::STATUS_DONE
            && $this->due_date !== null
            && $this->due_date->toDateString() < self::today();
    }

    /**
     * @param  Builder<Task>  $query
     */
    public function scopeOverdue(Builder $query): void
    {
        $query->where('status', '!=', self::STATUS_DONE)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', self::today());
    }

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
     * @return BelongsToMany<Tag, $this>
     */
    public function tags(): BelongsToMany
    {
        // LOWER(): urutan sama di SQLite dan MySQL (tidak membedakan huruf besar).
        return $this->belongsToMany(Tag::class, 'task_tag')->orderByRaw('LOWER(tags.name)');
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

    /**
     * Hanya Admin dan pembuat tugas yang boleh mengedit, menghapus, dan
     * mengelola assignee/tag. Assignee cukup melihat dan mengubah status.
     */
    public function isOwnedBy(User $user): bool
    {
        return $user->isAdmin() || (int) $this->created_by === $user->id;
    }
}
