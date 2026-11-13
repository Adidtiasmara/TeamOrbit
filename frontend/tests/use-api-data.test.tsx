import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useApiData } from "../app/hooks/useApiData";

/** Promise yang bisa diselesaikan dari luar, untuk mengatur urutan jawaban. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("useApiData", () => {
  it("berpindah dari loading ke success", async () => {
    const { result } = renderHook(() =>
      useApiData("tasks", () => Promise.resolve(["a", "b"])),
    );

    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toEqual(["a", "b"]);
  });

  it("berpindah dari loading ke error dan menyimpan error-nya", async () => {
    const failure = new Error("gagal");
    const { result } = renderHook(() =>
      useApiData("tasks", () => Promise.reject(failure)),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe(failure);
    expect(result.current.data).toBeNull();
  });

  it("jawaban key lama yang datang terlambat tidak menimpa key baru", async () => {
    const pending: Record<string, ReturnType<typeof deferred<string>>> = {
      semua: deferred<string>(),
      selesai: deferred<string>(),
    };
    const { result, rerender } = renderHook(
      ({ filter }) => useApiData(filter, () => pending[filter].promise),
      { initialProps: { filter: "semua" } },
    );

    rerender({ filter: "selesai" });
    expect(result.current.status).toBe("loading");

    await act(async () => {
      pending.selesai.resolve("data selesai");
    });
    expect(result.current.data).toBe("data selesai");

    await act(async () => {
      pending.semua.resolve("data semua (terlambat)");
    });
    expect(result.current.status).toBe("success");
    expect(result.current.data).toBe("data selesai");
  });

  it("tidak memperbarui state setelah komponen dilepas", async () => {
    const pending = deferred<string>();
    const consoleError = vi.spyOn(console, "error");
    const { result, unmount } = renderHook(() =>
      useApiData("users", () => pending.promise),
    );

    unmount();
    await act(async () => {
      pending.resolve("terlambat");
    });

    expect(result.current.status).toBe("loading");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("reload kembali ke loading lalu memuat ulang", async () => {
    const load = vi
      .fn<() => Promise<number>>()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    const { result } = renderHook(() => useApiData("count", load));

    await waitFor(() => expect(result.current.data).toBe(1));

    act(() => result.current.reload());
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.data).toBe(2));
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("tidak memuat ulang hanya karena fungsi load dibuat ulang tiap render", async () => {
    const load = vi.fn(() => Promise.resolve("ok"));
    const { result, rerender } = renderHook(() =>
      useApiData("stable", () => load()),
    );

    await waitFor(() => expect(result.current.status).toBe("success"));
    rerender();
    rerender();

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("setData mengubah data lokal, langsung atau lewat fungsi", async () => {
    const { result } = renderHook(() =>
      useApiData("items", () => Promise.resolve([1, 2])),
    );

    await waitFor(() => expect(result.current.status).toBe("success"));

    act(() => result.current.setData([9]));
    expect(result.current.data).toEqual([9]);

    act(() => result.current.setData((current) => [...current, 10]));
    expect(result.current.data).toEqual([9, 10]);
  });
});
