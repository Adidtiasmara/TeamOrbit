// Pesan singkat yang dibawa ke halaman berikutnya setelah redirect,
// mis. "Tugas dihapus." setelah kembali ke daftar tugas.
const FLASH_KEY = "teamorbit.flash";

export function setFlash(message: string): void {
  window.sessionStorage.setItem(FLASH_KEY, message);
}

export function takeFlash(): string | null {
  const message = window.sessionStorage.getItem(FLASH_KEY);

  if (message !== null) {
    window.sessionStorage.removeItem(FLASH_KEY);
  }

  return message;
}
