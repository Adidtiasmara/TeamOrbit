"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TaskForm } from "../../components/forms/TaskForm";
import {
  TaskDates,
  TaskSummaryPanel,
} from "../../components/tasks/TaskSections";
import { Alert } from "../../components/ui/Alert";
import { Avatar } from "../../components/ui/Avatar";
import { TAGLINE } from "../../components/ui/Brand";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Spinner, StateMessage } from "../../components/ui/StateMessage";
import { OverdueBadge, StatusBadge } from "../../components/ui/StatusBadge";
import { TagChip } from "../../components/ui/TagChip";
import { useApiData } from "../../hooks/useApiData";
import { useAuth } from "../../hooks/useAuth";
import { errorMessage, listTasks } from "../../lib/api";
import { takeFlash } from "../../lib/flash";
import { isAdmin } from "../../lib/permissions";
import type { Task, TaskStatus } from "../../lib/types";

type Filter = "semua" | TaskStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "belum_selesai", label: "Belum selesai" },
  { value: "selesai", label: "Selesai" },
];

const EMPTY_MESSAGES: Record<Filter, string> = {
  semua: "Belum ada tugas. Buat tugas pertama untuk tim.",
  belum_selesai: "Tidak ada tugas yang belum selesai.",
  selesai: "Belum ada tugas yang selesai.",
};

export default function TasksPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("semua");
  const tasks = useApiData(`tasks:${filter}`, () =>
    listTasks(filter === "semua" ? undefined : filter),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Pesan dari halaman sebelumnya, mis. setelah tugas dihapus.
  useEffect(() => {
    const flash = takeFlash();

    if (flash) {
      setNotice(flash);
    }
  }, []);

  const admin = isAdmin(user);
  // Naik setiap ada tugas baru supaya statistik ikut dimuat ulang.
  const [version, setVersion] = useState(0);

  const handleCreated = (task: Task) => {
    setFormOpen(false);
    setNotice(`Tugas "${task.title}" dibuat.`);
    tasks.reload();
    setVersion((value) => value + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {admin ? "Kelola tugas" : "Tugas tim"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {admin ? "Pantau dan kelola seluruh tugas tim." : TAGLINE}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setNotice(null);
            setFormOpen(true);
          }}
        >
          + Tugas baru
        </Button>
      </div>

      {/* Statistik seluruh tugas tim, tidak terpengaruh filter status. */}
      {admin && <TaskSummaryPanel version={version} />}

      <div
        role="group"
        aria-label="Filter status"
        className="flex flex-wrap gap-2"
      >
        {FILTERS.map((option) => {
          const active = option.value === filter;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(option.value)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "border-primary bg-primary text-primary-ink"
                  : "border-line bg-surface text-ink hover:bg-surface-2"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <Alert>
        {admin ? (
          <>
            Kamu login sebagai <strong>Admin</strong>: semua tugas tim tampil
            di sini.
          </>
        ) : (
          <>
            Kamu login sebagai <strong>Member</strong>: hanya tugas yang kamu
            buat atau yang ditugaskan kepadamu yang tampil.
          </>
        )}
      </Alert>

      {notice && <Alert tone="success">{notice}</Alert>}

      {tasks.status === "error" ? (
        <StateMessage title={errorMessage(tasks.error)}>
          <Button onClick={tasks.reload}>Coba lagi</Button>
        </StateMessage>
      ) : tasks.status === "loading" ? (
        <Spinner label="Memuat tugas..." />
      ) : tasks.data.length === 0 ? (
        <StateMessage title={EMPTY_MESSAGES[filter]} />
      ) : (
        <ul className="space-y-3">
          {tasks.data.map((task) => (
            <li key={task.id}>
              <TaskRow task={task} />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={formOpen}
        title="Tugas baru"
        onClose={() => setFormOpen(false)}
      >
        <TaskForm
          onSaved={handleCreated}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded-xl border border-line bg-surface p-4 transition hover:border-line-strong hover:shadow-sm focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={`min-w-0 break-words font-medium ${
            task.status === "selesai" ? "text-muted line-through" : "text-ink"
          }`}
        >
          {task.title}
        </p>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {task.is_overdue && <OverdueBadge />}
          <StatusBadge status={task.status} />
        </div>
      </div>
      {(task.start_date || task.due_date) && (
        <p className="mt-1 text-xs text-muted">
          <TaskDates task={task} />
        </p>
      )}
      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <TagChip key={tag.id} name={tag.name} color={tag.color} size="sm" />
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        {task.assignees.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {task.assignees.slice(0, 4).map((assignee) => (
                <span
                  key={assignee.id}
                  className="rounded-full ring-2 ring-surface"
                >
                  <Avatar name={assignee.name} size="sm" />
                </span>
              ))}
            </div>
            <span>
              {task.assignees.map((assignee) => assignee.name).join(", ")}
            </span>
          </div>
        ) : (
          <span>Belum ada assignee</span>
        )}
        <span>Dibuat oleh {task.created_by?.name ?? "akun yang dihapus"}</span>
      </div>
    </Link>
  );
}
