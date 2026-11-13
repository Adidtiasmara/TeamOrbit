"use client";

import { useState } from "react";
import {
  ApiError,
  deleteTask,
  errorMessage,
  getTask,
  removeAssignee,
  removeTaskTag,
} from "../../lib/api";
import { formatDate, formatDateTime } from "../../lib/format";
import type { Tag, Task, TaskSummary, UserSummary } from "../../lib/types";
import { AssigneeForm } from "../forms/AssigneeForm";
import { TagForm } from "../forms/TagForm";
import { Alert } from "../ui/Alert";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { CloseIcon } from "../ui/Icons";
import { Modal } from "../ui/Modal";
import { TagChip } from "../ui/TagChip";

const CARD = "rounded-xl border border-line bg-surface p-5";

/** Aksi panel yang mengubah tugas; pesan ditampilkan oleh halaman. */
interface PanelProps {
  task: Task;
  canManage: boolean;
  onTaskChange: (task: Task) => void;
  onActionStart: () => void;
  onError: (message: string) => void;
}

/** Ringkasan tanggal satu baris, mis. "20 Nov 2026 – 25 Nov 2026". */
export function TaskDates({ task }: { task: Task }) {
  if (!task.start_date && !task.due_date) {
    return null;
  }

  return (
    <span className={task.is_overdue ? "font-medium text-danger" : undefined}>
      {task.start_date && <>Mulai {formatDate(task.start_date)}</>}
      {task.start_date && task.due_date && " · "}
      {task.due_date && <>Deadline {formatDate(task.due_date)}</>}
    </span>
  );
}

const STATS: { key: keyof TaskSummary; label: string; tone: string }[] = [
  { key: "total", label: "Total tugas", tone: "text-ink" },
  { key: "done", label: "Selesai", tone: "text-done" },
  { key: "pending", label: "Belum selesai", tone: "text-todo" },
  { key: "overdue", label: "Terlambat", tone: "text-danger" },
];

/** Kartu statistik tugas; dipakai Admin (seluruh tim) dan Member (miliknya). */
export function TaskStats({ summary }: { summary: TaskSummary }) {
  return (
    <section aria-label="Statistik tugas" className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.key} className={CARD}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {stat.label}
            </p>
            <p className={`mt-1 text-2xl font-bold ${stat.tone}`}>
              {summary[stat.key]}
            </p>
          </div>
        ))}
      </div>
      <div className={CARD}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-ink">
            {summary.done} dari {summary.total} tugas selesai
          </span>
          <span className="font-semibold text-ink">{summary.percent_done}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Persentase tugas selesai"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={summary.percent_done}
          className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${summary.percent_done}%` }}
          />
        </div>
      </div>
    </section>
  );
}

export function TaskInfo({ task }: { task: Task }) {
  return (
    <>
      <section className={CARD}>
        <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-muted">Tanggal mulai</dt>
          <dd className="text-ink">
            {task.start_date ? formatDate(task.start_date) : "-"}
          </dd>
          <dt className="text-muted">Deadline</dt>
          <dd className={task.is_overdue ? "font-medium text-danger" : "text-ink"}>
            {task.due_date ? formatDate(task.due_date) : "-"}
            {task.is_overdue && " (terlambat)"}
          </dd>
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

      <section className={`space-y-2 ${CARD}`}>
        <h2 className="text-sm font-semibold text-ink">Deskripsi</h2>
        <p className="whitespace-pre-wrap break-words text-sm text-ink">
          {task.description || (
            <span className="text-muted">Tidak ada deskripsi.</span>
          )}
        </p>
      </section>
    </>
  );
}

export function TaskTagsPanel({
  task,
  canManage,
  allTags,
  onTagCreated,
  onTaskChange,
  onActionStart,
  onError,
}: PanelProps & { allTags: Tag[]; onTagCreated: (tag: Tag) => void }) {
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemove = async (tag: Tag) => {
    setRemovingId(tag.id);
    onActionStart();

    try {
      await removeTaskTag(task.id, tag.id);
      onTaskChange({ ...task, tags: task.tags.filter((item) => item.id !== tag.id) });
    } catch (error) {
      onError(errorMessage(error));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className={`space-y-4 ${CARD}`}>
      <h2 className="text-sm font-semibold text-ink">Tag</h2>

      {task.tags.length === 0 ? (
        <p className="text-sm text-muted">Belum ada tag.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {task.tags.map((tag) => (
            <li key={tag.id} className="max-w-full">
              <TagChip
                name={tag.name}
                onRemove={canManage ? () => handleRemove(tag) : undefined}
                removing={removingId !== null}
              />
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <TagForm
          task={task}
          tags={allTags}
          onTagCreated={onTagCreated}
          onAttached={(updated) => {
            onActionStart();
            onTaskChange(updated);
          }}
        />
      )}
    </section>
  );
}

export function TaskAssigneesPanel({
  task,
  canManage,
  users,
  currentUserId,
  onSelfRemoved,
  onTaskChange,
  onActionStart,
  onError,
}: PanelProps & {
  users: UserSummary[];
  currentUserId: number | undefined;
  /** Dipanggil kalau melepas diri sendiri membuat user kehilangan akses. */
  onSelfRemoved: () => void;
}) {
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemove = async (assignee: UserSummary) => {
    setRemovingId(assignee.id);
    onActionStart();

    try {
      await removeAssignee(task.id, assignee.id);
    } catch (error) {
      onError(errorMessage(error));
      setRemovingId(null);
      return;
    }

    if (assignee.id === currentUserId) {
      // Melepas diri sendiri bisa menghilangkan akses ke tugas ini.
      try {
        onTaskChange(await getTask(task.id));
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
          onSelfRemoved();
          return;
        }

        onError(errorMessage(error));
      }
    } else {
      onTaskChange({
        ...task,
        assignees: task.assignees.filter((item) => item.id !== assignee.id),
      });
    }

    setRemovingId(null);
  };

  return (
    <section className={`space-y-4 ${CARD}`}>
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
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleRemove(assignee)}
                  disabled={removingId !== null}
                  aria-label={`Hapus ${assignee.name} dari assignee`}
                  className="rounded-full p-0.5 text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && users.length > 0 && (
        <AssigneeForm
          task={task}
          users={users}
          onAdded={(updated) => {
            onActionStart();
            onTaskChange(updated);
          }}
        />
      )}
    </section>
  );
}

export function DeleteTaskDialog({
  task,
  open,
  onClose,
  onDeleted,
}: {
  task: Task;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      await deleteTask(task.id);
    } catch (caught) {
      setError(errorMessage(caught));
      setDeleting(false);
      return;
    }

    onDeleted();
  };

  const close = () => {
    if (!deleting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal open={open} title="Hapus tugas?" onClose={close}>
      <div className="space-y-3 px-5 py-4 text-sm text-ink">
        {error && <Alert tone="error">{error}</Alert>}
        <p>
          Tugas <strong className="break-words">&quot;{task.title}&quot;</strong>{" "}
          beserta daftar assignee-nya akan dihapus permanen.
        </p>
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
        <Button data-autofocus onClick={close} disabled={deleting}>
          Batal
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={deleting}>
          Hapus tugas
        </Button>
      </div>
    </Modal>
  );
}
