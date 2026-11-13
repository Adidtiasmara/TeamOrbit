import type { Role, TagColor, TaskStatus } from "./types";

/** Urutan di sini juga urutan pilihan warna di form. */
export const TAG_COLOR_LABELS: Record<TagColor, string> = {
  abu: "Abu-abu",
  merah: "Merah",
  oranye: "Oranye",
  kuning: "Kuning",
  hijau: "Hijau",
  biru: "Biru",
  ungu: "Ungu",
  merah_muda: "Merah muda",
};

export const TAG_COLORS = Object.keys(TAG_COLOR_LABELS) as TagColor[];

export const DEFAULT_TAG_COLOR: TagColor = "abu";

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
