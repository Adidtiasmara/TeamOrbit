<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

/**
 * Admin boleh semua tugas; Member hanya tugas yang ia buat atau yang
 * ditugaskan kepadanya. Aturannya ada di Task::scopeVisibleTo().
 */
class TaskPolicy
{
    public function view(User $user, Task $task): bool
    {
        return $task->isAccessibleBy($user);
    }

    public function update(User $user, Task $task): bool
    {
        return $task->isAccessibleBy($user);
    }

    public function delete(User $user, Task $task): bool
    {
        return $task->isAccessibleBy($user);
    }

    public function manageAssignees(User $user, Task $task): bool
    {
        return $task->isAccessibleBy($user);
    }
}
