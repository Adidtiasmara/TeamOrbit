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

/** Palet warna tag; sama dengan Tag::COLORS di backend. */
export type TagColor =
  | "abu"
  | "merah"
  | "oranye"
  | "kuning"
  | "hijau"
  | "biru"
  | "ungu"
  | "merah_muda";

export interface Tag {
  id: number;
  name: string;
  color: TagColor;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** Format YYYY-MM-DD, null kalau tidak diisi. */
  start_date: string | null;
  due_date: string | null;
  /** Belum selesai dan deadline sudah lewat (dihitung backend). */
  is_overdue: boolean;
  /** null kalau akun pembuatnya sudah dihapus. */
  created_by: UserSummary | null;
  assignees: UserSummary[];
  /** Urut nama. */
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface TaskSummary {
  total: number;
  done: number;
  pending: number;
  overdue: number;
  percent_done: number;
}

export interface AuthPayload {
  user: User;
  token: string;
}

/** Error validasi per field dari respons 422 backend. */
export type FieldErrors = Record<string, string[]>;
