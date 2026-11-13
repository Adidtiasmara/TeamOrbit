"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "../components/layouts/AppShell";
import { Button } from "../components/ui/Button";
import { Spinner, StateMessage } from "../components/ui/StateMessage";
import { useAuth } from "../hooks/useAuth";

// Semua halaman di grup ini wajib login; tamu diarahkan ke /login.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { status, retry } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "authenticated") {
    return <AppShell>{children}</AppShell>;
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <StateMessage title="Tidak bisa terhubung ke server.">
          <Button onClick={retry}>Coba lagi</Button>
        </StateMessage>
      </div>
    );
  }

  return (
    <div className="py-24">
      <Spinner />
    </div>
  );
}
