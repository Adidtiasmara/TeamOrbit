// Token Sanctum disimpan di sisi klien (localStorage) dan dikirim sebagai
// header Authorization: Bearer oleh lib/api.ts.
const TOKEN_KEY = "teamorbit.token";

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}
