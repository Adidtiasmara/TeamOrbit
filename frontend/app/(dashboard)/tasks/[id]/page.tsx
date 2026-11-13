"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AssigneeForm } from "../../../components/forms/AssigneeForm";
import { Alert } from "../../../components/ui/Alert";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { Spinner, StateMessage } from "../../../components/ui/StateMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useAuth } from "../../../hooks/useAuth";
import {
  ApiError,
  errorMessage,
  getTask,
  listAssignableUsers,
  removeAssignee,
  updateTask,
} from "../../../lib/api";
import { formatDateTime } from "../../../lib/format";
import type { Task, UserSummary } from "../../../lib/types";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();

  // key: state di-reset saat pindah ke tugas lain.
  return <TaskDetail key={id} taskId={id} />;
}

function BackLink() {
  return (
    <Link
      href="/tasks"
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
    >
      <span aria-hidden>←</span> Kembali ke daftar tugas
    </Link>
  );
}

function loadErrorTitle(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "Tugas tidak ditemukan.";
  }

  if (error instanceof ApiError && error.status === 403) {
    return "Kamu tidak punya akses ke tugas ini.";
  }

  return errorMessage(error);
}

function TaskDetail({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    getTask(taskId)
      .then((result) => {
        if (!cancelled) {
          setTask(result);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error);
        }
      });

    // Daftar user untuk dropdown; kalau gagal, form tambah assignee disembunyikan.
    listAssignableUsers()
      .then((result) => {
        if (!cancelled) {
          setUsers(result);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  if (loadError) {
    return (
      <div className="space-y-6">
        <BackLink />
        <StateMessage title={loadErrorTitle(loadError)} />
      </div>
    );
  }

  if (!task) {
    return <Spinner label="Memuat tugas..." />;
  }

  const done = task.status === "selesai";

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    setActionError(null);

    try {
      setTask(
        await updateTask(task.id, {
          status: done ? "belum_selesai" : "selesai",
        }),
      );
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleRemove = async (assignee: UserSummary) => {
    setRemovingId(assignee.id);
    setActionError(null);

    try {
      await removeAssignee(task.id, assignee.id);
    } catch (error) {
      setActionError(errorMessage(error));
      setRemovingId(null);
      return;
    }

    if (assignee.id === user?.id) {
      // Melepas diri sendiri bisa menghilangkan akses ke tugas ini.
      try {
        setTask(await getTask(task.id));
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
          router.replace("/tasks");
          return;
        }

        setActionError(errorMessage(error));
      }
    } else {
      setTask({
        ...task,
        assignees: task.assignees.filter((item) => item.id !== assignee.id),
      });
    }

    setRemovingId(null);
  };

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="min-w-0 break-words text-2xl font-bold text-ink">
            {task.title}
          </h1>
          <StatusBadge status={task.status} />
        </div>
        <Button onClick={handleToggleStatus} loading={togglingStatus}>
          {done ? "Tandai belum selesai" : "Tandai selesai"}
        </Button>
      </div>

      {actionError && <Alert tone="error">{actionError}</Alert>}

      <section className="rounded-xl border border-line bg-surface p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-muted">Dibuat oleh</dt>
          <dd className="text-ink">
            {task.created_by?.name ?? "Akun pembuat sudah dihapus"}
          </dd>
          <dt className="text-muted">Dibuat</dt>
          <dd className="text-ink">{formatDateTime(task.created_at)}</dd>
          <dt className="text-muted">Terakhir diubah</dt>
          <dd className="text-ink">{formatDateTime(task.updated_at)}</dd>
        </dl>
      </section>

      <section className="space-y-2 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Deskripsi</h2>
        <p className="whitespace-pre-wrap break-words text-sm text-ink">
          {task.description || (
            <span className="text-muted">Tidak ada deskripsi.</span>
          )}
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
        <div>
          <h2 className="text-sm font-semibold text-ink">Assignee</h2>
          <p className="mt-1 text-xs text-muted">
            Pembuat tugas tidak otomatis menjadi assignee; tambahkan secara
            eksplisit bila perlu.
          </p>
        </div>

        {task.assignees.length === 0 ? (
          <p className="text-sm text-muted">Belum ada assignee.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {task.assignees.map((assignee) => (
              <li
                key={assignee.id}
                className="flex items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pl-1 pr-2 text-sm"
              >
                <Avatar name={assignee.name} size="sm" />
                <span className="text-ink">{assignee.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(assignee)}
                  disabled={removingId !== null}
                  aria-label={`Hapus ${assignee.name} dari assignee`}
                  className="rounded-full p-0.5 text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                >
                  <svg
                    aria-hidden
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {users.length > 0 && (
          <AssigneeForm
            task={task}
            users={users}
            onAdded={(updated) => {
              setActionError(null);
              setTask(updated);
            }}
          />
        )}
      </section>
    </div>
  );
}
