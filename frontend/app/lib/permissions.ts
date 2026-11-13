import type { Task, User } from "./types";

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

/**
 * Sama dengan TaskPolicy di backend (design/RBAC.md): edit, hapus, dan
 * kelola assignee/tag hanya untuk Admin atau pembuat tugas.
 * Hanya untuk menampilkan/menyembunyikan tombol; backend tetap memeriksa.
 */
export function canManageTask(user: User | null, task: Task): boolean {
  if (!user) {
    return false;
  }

  return isAdmin(user) || task.created_by?.id === user.id;
}

/** Ubah status: pengelola tugas ditambah assignee. */
export function canUpdateStatus(user: User | null, task: Task): boolean {
  if (!user) {
    return false;
  }

  return (
    canManageTask(user, task) ||
    task.assignees.some((assignee) => assignee.id === user.id)
  );
}
