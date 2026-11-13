"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, getMe, logout, UNAUTHORIZED_EVENT } from "../lib/api";
import { clearToken, getToken, setToken } from "../lib/auth";
import type { AuthPayload, User } from "../lib/types";

/**
 * loading: token sedang dicek ke /me
 * authenticated: user valid
 * guest: belum login / token ditolak
 * error: server tidak bisa dihubungi, token tetap disimpan
 */
export type AuthStatus = "loading" | "authenticated" | "guest" | "error";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  signIn: (payload: AuthPayload) => void;
  signOut: () => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      setStatus("guest");
      return;
    }

    let cancelled = false;

    getMe()
      .then((me) => {
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setUser(null);
        setStatus(
          error instanceof ApiError && error.status === 401 ? "guest" : "error",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setStatus("guest");
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);

    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const signIn = useCallback((payload: AuthPayload) => {
    setToken(payload.token);
    setUser(payload.user);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // Token tetap dihapus di klien walau server gagal dihubungi.
    } finally {
      clearToken();
      setUser(null);
      setStatus("guest");
    }
  }, []);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signOut, retry }),
    [user, status, signIn, signOut, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus dipakai di dalam <AuthProvider>.");
  }

  return context;
}
