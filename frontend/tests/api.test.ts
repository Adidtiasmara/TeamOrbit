import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_URL,
  ApiError,
  createTask,
  errorMessage,
  listTasks,
  login,
  removeAssignee,
  UNAUTHORIZED_EVENT,
} from "../app/lib/api";
import { getToken, setToken } from "../app/lib/auth";
import { makeTask } from "./fixtures";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function lastRequest(): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls.at(-1) ?? [];

  return { url: String(url), init: init ?? {} };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("lib/api", () => {
  it("mengirim token Bearer dan filter status, lalu mengembalikan isi `data`", async () => {
    setToken("token-budi");
    const task = makeTask({ status: "selesai" });
    fetchMock.mockResolvedValue(jsonResponse(200, { data: [task] }));

    await expect(listTasks("selesai")).resolves.toEqual([task]);

    const { url, init } = lastRequest();
    const headers = init.headers as Record<string, string>;

    expect(url).toBe(`${API_URL}/tasks?status=selesai`);
    expect(init.method).toBe("GET");
    expect(headers.Accept).toBe("application/json");
    expect(headers.Authorization).toBe("Bearer token-budi");
  });

  it("mengirim body JSON saat membuat tugas", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { data: makeTask() }));

    await createTask({ title: "Siapkan laporan", description: null });

    const { url, init } = lastRequest();

    expect(url).toBe(`${API_URL}/tasks`);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
    expect(JSON.parse(String(init.body))).toEqual({
      title: "Siapkan laporan",
      description: null,
    });
  });

  it("respons 204 diselesaikan tanpa isi", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(removeAssignee(10, 3)).resolves.toBeUndefined();
    expect(lastRequest().url).toBe(`${API_URL}/tasks/10/assignees/3`);
    expect(lastRequest().init.method).toBe("DELETE");
  });

  it("respons 422 menjadi ApiError beserta error per field", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        message: "Validasi gagal.",
        errors: { title: ["Judul wajib diisi, maksimal 100 karakter."] },
      }),
    );

    const error = await createTask({ title: "", description: null }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect((error as ApiError).message).toBe("Validasi gagal.");
    expect((error as ApiError).fieldError("title")).toBe(
      "Judul wajib diisi, maksimal 100 karakter.",
    );
  });

  it("401 dengan token: token dihapus dan event unauthorized dikirim", async () => {
    setToken("token-kedaluwarsa");
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    fetchMock.mockResolvedValue(
      jsonResponse(401, { message: "Belum login atau token tidak valid." }),
    );

    await expect(listTasks()).rejects.toMatchObject({ status: 401 });

    expect(getToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it("401 saat login (tanpa token) tidak memicu logout otomatis", async () => {
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    fetchMock.mockResolvedValue(
      jsonResponse(401, { message: "Email atau password salah." }),
    );

    await expect(login("budi@teamorbit.test", "salah")).rejects.toMatchObject({
      status: 401,
      message: "Email atau password salah.",
    });

    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it("server tidak bisa dihubungi menjadi ApiError status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(listTasks()).rejects.toMatchObject({
      status: 0,
      message: "Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.",
    });
  });

  it("errorMessage memberi pesan umum untuk error non-API", () => {
    expect(errorMessage(new Error("x"))).toBe("Terjadi kesalahan. Coba lagi.");
    expect(errorMessage(new ApiError(403, "Akses ditolak."))).toBe(
      "Akses ditolak.",
    );
  });

  it("errorMessage dengan field mendahulukan pesan field itu", () => {
    const error = new ApiError(422, "Validasi gagal.", {
      user_id: ["User sudah menjadi assignee tugas ini."],
    });

    expect(errorMessage(error, "user_id")).toBe(
      "User sudah menjadi assignee tugas ini.",
    );
    expect(errorMessage(error, "role")).toBe("Validasi gagal.");
    expect(errorMessage(error)).toBe("Validasi gagal.");
    expect(errorMessage(new Error("x"), "user_id")).toBe(
      "Terjadi kesalahan. Coba lagi.",
    );
  });
});
