import type { Role, TaskStatus } from "./types";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  belum_selesai: "Belum selesai",
  selesai: "Selesai",
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  member: "Member",
};

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

/** "2026-11-20" menjadi "20 Nov 2026"; dibaca sebagai tanggal lokal, bukan UTC. */
export function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return dateFormatter.format(new Date(year, month - 1, day));
}

export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (letters || "?").toUpperCase();
}
