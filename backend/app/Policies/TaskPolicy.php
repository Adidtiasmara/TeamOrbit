<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

/**
 * Lihat & ubah status: Admin, pembuat, atau assignee (Task::scopeVisibleTo()).
 * Edit, hapus, kelola assignee/tag: hanya Admin atau pembuat (Task::isOwnedBy()).
 */
class TaskPolicy
{
    public function view(User $user, Task $task): bool
    {
        return $task->isAccessibleBy($user);
    }

    public function updateStatus(User $user, Task $task): bool
    {
        return $task->isAccessibleBy($user);
    }

    public function update(User $user, Task $task): bool
    {
        return $task->isOwnedBy($user);
    }

    public function delete(User $user, Task $task): bool
    {
        return $task->isOwnedBy($user);
    }

    public function manageAssignees(User $user, Task $task): bool
    {
        return $task->isOwnedBy($user);
    }

    public function manageTags(User $user, Task $task): bool
    {
        return $task->isOwnedBy($user);
    }
}
