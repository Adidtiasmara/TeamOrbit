"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ApiData<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: unknown };

type Settled<T> =
  | { requestKey: string; status: "success"; data: T }
  | { requestKey: string; status: "error"; error: unknown };

type Updater<T> = T | ((current: T) => T);

const LOADING = { status: "loading", data: null, error: null } as const;

/**
 * Mengambil data dari API untuk satu halaman.
 *
 * - Mengganti `key` (mis. filter) atau memanggil `reload()` langsung kembali
 *   ke status loading lalu memuat ulang.
 * - Jawaban untuk `key` lama yang datang terlambat diabaikan, dan tidak ada
 *   update state setelah komponen dilepas.
 * - `setData` untuk perubahan lokal setelah aksi (mis. tugas setelah diedit).
 */
export function useApiData<T>(key: string, load: () => Promise<T>) {
  const loadRef = useRef(load);
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const requestKey = `${key}#${attempt}`;

  // Dideklarasikan sebelum effect pemuat supaya `load` terbaru yang dipakai.
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let cancelled = false;

    loadRef.current().then(
      (data) => {
        if (!cancelled) {
          setSettled({ requestKey, status: "success", data });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setSettled({ requestKey, status: "error", error });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  const setData = useCallback((next: Updater<T>) => {
    setSettled((current) => {
      if (current?.status !== "success") {
        return current;
      }

      const data =
        typeof next === "function"
          ? (next as (value: T) => T)(current.data)
          : next;

      return { ...current, data };
    });
  }, []);

  let state: ApiData<T> = LOADING;

  if (settled?.requestKey === requestKey) {
    state =
      settled.status === "success"
        ? { status: "success", data: settled.data, error: null }
        : { status: "error", data: null, error: settled.error };
  }

  return { ...state, reload, setData };
}
