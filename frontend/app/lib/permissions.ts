import type { Task, User } from "./types";

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

/**
 * Sama dengan TaskPolicy di backend (design/RBAC.md): Admin boleh semua
 * tugas, Member hanya tugas yang ia buat atau yang ditugaskan kepadanya.
 * Hanya untuk menampilkan/menyembunyikan tombol; backend tetap memeriksa.
 */
export function canManageTask(user: User | null, task: Task): boolean {
  if (!user) {
    return false;
  }

  return (
    isAdmin(user) ||
    task.created_by?.id === user.id ||
    task.assignees.some((assignee) => assignee.id === user.id)
  );
}
