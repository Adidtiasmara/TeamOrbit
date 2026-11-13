export const TITLE_MAX_LENGTH = 100;

export const TITLE_ERROR = "Judul wajib diisi, maksimal 100 karakter.";

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Panjang judul setelah trim, dihitung per karakter (bukan per unit UTF-16)
 * supaya sama dengan aturan backend (max:100 setelah TrimStrings).
 */
export function titleLength(title: string): number {
  return Array.from(title.trim()).length;
}

export function validateTitle(title: string): string | null {
  const length = titleLength(title);

  return length === 0 || length > TITLE_MAX_LENGTH ? TITLE_ERROR : null;
}

export const TAG_NAME_MAX_LENGTH = 50;

export const TAG_NAME_ERROR = "Nama tag wajib diisi, maksimal 50 karakter.";

export function validateTagName(name: string): string | null {
  const length = Array.from(name.trim()).length;

  return length === 0 || length > TAG_NAME_MAX_LENGTH ? TAG_NAME_ERROR : null;
}

/** Sama dengan aturan unik backend: tidak membedakan huruf besar/kecil. */
export function sameTagName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

export const DUE_BEFORE_START_ERROR =
  "Deadline tidak boleh sebelum tanggal mulai.";

/** Sama dengan aturan backend; tanggal berformat YYYY-MM-DD bisa dibandingkan sebagai teks. */
export function validateDates(start: string, due: string): string | null {
  return start && due && due < start ? DUE_BEFORE_START_ERROR : null;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
