"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert } from "../../components/ui/Alert";
import { Avatar } from "../../components/ui/Avatar";
import { Button, buttonClassName } from "../../components/ui/Button";
import { inputClassName } from "../../components/ui/Field";
import { SpinnerIcon } from "../../components/ui/Icons";
import { RoleBadge } from "../../components/ui/RoleBadge";
import { Spinner, StateMessage } from "../../components/ui/StateMessage";
import { useApiData } from "../../hooks/useApiData";
import { useAuth } from "../../hooks/useAuth";
import { errorMessage, listUsers, updateUserRole } from "../../lib/api";
import { ROLE_LABELS } from "../../lib/format";
import { isAdmin } from "../../lib/permissions";
import type { Role, User } from "../../lib/types";

export default function UsersPage() {
  const { user } = useAuth();

  if (!user || !isAdmin(user)) {
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

  return <UserManagement currentUserId={user.id} />;
}

function UserManagement({ currentUserId }: { currentUserId: number }) {
  const users = useApiData("users", listUsers);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRoleChange = async (target: User, role: Role) => {
    setSavingId(target.id);
    setNotice(null);
    setActionError(null);

    try {
      const updated = await updateUserRole(target.id, role);

      users.setData((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(
        `Role ${updated.name} diubah menjadi ${ROLE_LABELS[updated.role]}.`,
      );
    } catch (error) {
      setActionError(errorMessage(error, "role"));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Kelola pengguna</h1>
        <p className="mt-1 text-sm text-muted">
          Ubah role anggota tim. Hanya admin yang dapat mengakses halaman ini.
        </p>
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {actionError && <Alert tone="error">{actionError}</Alert>}

      {/* Dihitung dari daftar yang sudah dimuat; tidak tampil saat loading/error. */}
      {users.status === "success" && (
        <p className="text-sm text-muted">
          Total pengguna:{" "}
          <span className="font-semibold text-ink">{users.data.length}</span>
        </p>
      )}

      {users.status === "error" ? (
        <StateMessage title={errorMessage(users.error)}>
          <Button onClick={users.reload}>Coba lagi</Button>
        </StateMessage>
      ) : users.status === "loading" ? (
        <Spinner label="Memuat pengguna..." />
      ) : (
        // relative: label sr-only (absolute) ikut terpotong di area scroll,
        // tidak melebarkan halaman di layar sempit.
        <div className="relative overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Nama
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Email
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Role
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.data.map((item) => {
                const isSelf = item.id === currentUserId;
                const selectId = `role-${item.id}`;

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={item.name} />
                        <span className="font-medium text-ink">
                          {item.name}
                        </span>
                        {isSelf && (
                          <span className="text-xs text-muted">(kamu)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={item.role} />
                    </td>
                    <td className="px-4 py-3">
                      <label htmlFor={selectId} className="sr-only">
                        Ubah role {item.name}
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          id={selectId}
                          value={item.role}
                          disabled={isSelf || savingId !== null}
                          title={
                            isSelf
                              ? "Kamu tidak bisa mengubah role akunmu sendiri."
                              : undefined
                          }
                          onChange={(event) =>
                            handleRoleChange(item, event.target.value as Role)
                          }
                          className={`${inputClassName()} w-36 disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        {savingId === item.id && (
                          <SpinnerIcon className="border-muted" />
                        )}
                      </div>
                      {isSelf && (
                        <p className="mt-1 text-xs text-muted">
                          Tidak bisa mengubah role sendiri.
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
