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

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
