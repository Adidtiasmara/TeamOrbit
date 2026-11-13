"use client";

import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { RoleBadge } from "../../components/ui/RoleBadge";
import { Spinner, StateMessage } from "../../components/ui/StateMessage";
import { useApiData } from "../../hooks/useApiData";
import { errorMessage, getMe } from "../../lib/api";
import type { Role } from "../../lib/types";

const ROLE_ACCESS: Record<Role, string> = {
  admin: "Kamu bisa melihat dan mengelola seluruh tugas tim serta mengubah role pengguna.",
  member:
    "Kamu bisa membuat tugas, mengedit dan menghapus tugas buatanmu, serta mengubah status tugas yang ditugaskan kepadamu.",
};

export default function ProfilePage() {
  const me = useApiData("me", getMe);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Profil</h1>
        <p className="mt-1 text-sm text-muted">Informasi akun yang sedang login.</p>
      </div>

      {me.status === "error" ? (
        <StateMessage title={errorMessage(me.error)}>
          <Button onClick={me.reload}>Coba lagi</Button>
        </StateMessage>
      ) : me.status === "loading" ? (
        <Spinner label="Memuat profil..." />
      ) : (
        <section className="space-y-5 rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center gap-4">
            <Avatar name={me.data.name} size="lg" />
            <div className="min-w-0">
              <p className="break-words text-lg font-semibold text-ink">
                {me.data.name}
              </p>
              <RoleBadge role={me.data.role} />
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted">Nama</dt>
            <dd className="break-words text-ink">{me.data.name}</dd>
            <dt className="text-muted">Email</dt>
            <dd className="break-all text-ink">{me.data.email}</dd>
            <dt className="text-muted">Hak akses</dt>
            <dd className="text-ink">{ROLE_ACCESS[me.data.role]}</dd>
          </dl>
        </section>
      )}
    </div>
  );
}
