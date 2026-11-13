export type Role = "admin" | "member";

export type TaskStatus = "belum_selesai" | "selesai";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

/** Ringkasan user di objek tugas (pembuat, assignee) dan dropdown assignee. */
export interface UserSummary {
  id: number;
  name: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** null kalau akun pembuatnya sudah dihapus. */
  created_by: UserSummary | null;
  assignees: UserSummary[];
  created_at: string;
  updated_at: string;
}

export interface AuthPayload {
  user: User;
  token: string;
}

/** Error validasi per field dari respons 422 backend. */
export type FieldErrors = Record<string, string[]>;
