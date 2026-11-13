import type { Tag, Task, User } from "../app/lib/types";

export const admin: User = {
  id: 1,
  name: "Admin TeamOrbit",
  email: "admin@teamorbit.test",
  role: "admin",
};

export const budi: User = {
  id: 2,
  name: "Budi Member",
  email: "budi@teamorbit.test",
  role: "member",
};

export const ani: User = {
  id: 3,
  name: "Ani Member",
  email: "ani@teamorbit.test",
  role: "member",
};

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 10,
    title: "Siapkan laporan mingguan",
    description: null,
    status: "belum_selesai",
    created_by: { id: budi.id, name: budi.name },
    assignees: [],
    tags: [],
    start_date: null,
    due_date: null,
    is_overdue: false,
    created_at: "2026-11-13T08:00:00.000000Z",
    updated_at: "2026-11-13T08:00:00.000000Z",
    ...overrides,
  };
}

export function makeTag(id: number, name: string): Tag {
  return { id, name };
}
