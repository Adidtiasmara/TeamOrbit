"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Brand } from "../components/ui/Brand";
import { Spinner } from "../components/ui/StateMessage";
import { useAuth } from "../hooks/useAuth";

// Halaman login/register; user yang sudah login langsung ke dashboard.
export default function AuthLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/tasks");
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-start justify-center bg-bg px-4 py-12 sm:items-center">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Brand withTagline />
        </div>
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          {status === "loading" || status === "authenticated" ? (
            <Spinner />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
