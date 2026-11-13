import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "../app/components/forms/LoginForm";
import { ApiError } from "../app/lib/api";
import { clearToken, getToken, setToken } from "../app/lib/auth";
import { budi } from "./fixtures";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signIn: vi.fn(),
  login: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("../app/hooks/useAuth", () => ({
  useAuth: () => ({ signIn: mocks.signIn }),
}));

vi.mock("../app/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../app/lib/api")>()),
  login: mocks.login,
}));

describe("penyimpanan token", () => {
  it("menyimpan, membaca, dan menghapus token di localStorage", () => {
    expect(getToken()).toBeNull();
    setToken("abc");
    expect(getToken()).toBe("abc");
    clearToken();
    expect(getToken()).toBeNull();
  });
});

describe("LoginForm", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.signIn.mockReset();
    mocks.login.mockReset();
  });

  it("memvalidasi field kosong tanpa memanggil API", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Masuk" }));

    expect(screen.getByText("Email wajib diisi.")).toBeTruthy();
    expect(screen.getByText("Password wajib diisi.")).toBeTruthy();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("menolak format email yang salah", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "budi@");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Masuk" }));

    expect(screen.getByText("Format email tidak valid.")).toBeTruthy();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("menampilkan pesan dari API saat kredensial salah", async () => {
    const user = userEvent.setup();
    mocks.login.mockRejectedValue(
      new ApiError(401, "Email atau password salah."),
    );
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "budi@teamorbit.test");
    await user.type(screen.getByLabelText("Password"), "salah123");
    await user.click(screen.getByRole("button", { name: "Masuk" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Email atau password salah.",
    );
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("login berhasil menyimpan sesi lalu pindah ke /tasks", async () => {
    const user = userEvent.setup();
    const payload = { user: budi, token: "token-budi" };
    mocks.login.mockResolvedValue(payload);
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Isi member" }));
    await user.click(screen.getByRole("button", { name: "Masuk" }));

    expect(mocks.login).toHaveBeenCalledWith("budi@teamorbit.test", "password");
    expect(mocks.signIn).toHaveBeenCalledWith(payload);
    expect(mocks.replace).toHaveBeenCalledWith("/tasks");
  });
});
