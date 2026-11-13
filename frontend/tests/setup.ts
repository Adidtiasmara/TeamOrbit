import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Tanpa `globals: true`, Testing Library tidak membersihkan DOM sendiri.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});
