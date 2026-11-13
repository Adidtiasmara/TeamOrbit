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
