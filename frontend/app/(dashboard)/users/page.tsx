"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "../../components/ui/Alert";
import { Avatar } from "../../components/ui/Avatar";
import { Button, buttonClassName } from "../../components/ui/Button";
import { inputClassName } from "../../components/ui/Field";
import { RoleBadge } from "../../components/ui/RoleBadge";
import { Spinner, StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../hooks/useAuth";
import {
  ApiError,
  errorMessage,
  listUsers,
  updateUserRole,
} from "../../lib/api";
import { isAdmin } from "../../lib/permissions";
import type { Role, User } from "../../lib/types";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  member: "Member",
};

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
  const [users, setUsers] = useState<User[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listUsers()
      .then((result) => {
        if (!cancelled) {
          setUsers(result);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(errorMessage(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = () => {
    setUsers(null);
    setLoadError(null);
    setReloadKey((value) => value + 1);
  };

  const handleRoleChange = async (target: User, role: Role) => {
    setSavingId(target.id);
    setNotice(null);
    setActionError(null);

    try {
      const updated = await updateUserRole(target.id, role);

      setUsers((current) =>
        current?.map((item) => (item.id === updated.id ? updated : item)) ??
        null,
      );
      setNotice(
        `Role ${updated.name} diubah menjadi ${ROLE_LABELS[updated.role]}.`,
      );
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? (error.fieldError("role") ?? error.message)
          : errorMessage(error),
      );
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

      {loadError ? (
        <StateMessage title={loadError}>
          <Button onClick={reload}>Coba lagi</Button>
        </StateMessage>
      ) : users === null ? (
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
              {users.map((item) => {
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
                          <span
                            aria-hidden
                            className="size-4 animate-spin rounded-full border-2 border-muted border-t-transparent"
                          />
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
