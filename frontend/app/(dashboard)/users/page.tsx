"use client";

import Link from "next/link";
import { buttonClassName } from "../../components/ui/Button";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../hooks/useAuth";
import { isAdmin } from "../../lib/permissions";

// Kerangka halaman Admin Users. Daftar user dan ubah role diisi di Fase 6
// (endpoint GET /users dan PUT /users/{id}/role belum ada di backend).
export default function UsersPage() {
  const { user } = useAuth();

  if (!isAdmin(user)) {
    return (
      <div className="py-16 text-center">
        <p className="text-5xl font-bold text-ink">403</p>
        <p className="mt-3 text-sm text-muted">
          Akses ditolak. Halaman ini hanya untuk admin.
        </p>
        <Link href="/tasks" className={`${buttonClassName("primary")} mt-6`}>
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Kelola pengguna</h1>
        <p className="mt-1 text-sm text-muted">
          Ubah role anggota tim. Hanya admin yang dapat mengakses halaman ini.
        </p>
      </div>
      <StateMessage title="Daftar pengguna sedang disiapkan.">
        Fitur melihat daftar pengguna dan mengubah role akan tersedia di
        pembaruan berikutnya.
      </StateMessage>
    </div>
  );
}
