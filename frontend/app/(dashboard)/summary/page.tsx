"use client";

import Link from "next/link";
import {
  TaskDates,
  TaskSummaryPanel,
} from "../../components/tasks/TaskSections";
import { Button } from "../../components/ui/Button";
import { Spinner, StateMessage } from "../../components/ui/StateMessage";
import { OverdueBadge } from "../../components/ui/StatusBadge";
import { useApiData } from "../../hooks/useApiData";
import { useAuth } from "../../hooks/useAuth";
import { errorMessage, listTasks } from "../../lib/api";
import { isAdmin } from "../../lib/permissions";
import type { Task } from "../../lib/types";

const UPCOMING_LIMIT = 5;

/** Tugas belum selesai yang punya deadline, paling dekat lebih dulu. */
function upcoming(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => task.due_date)
    .sort((a, b) => (a.due_date as string).localeCompare(b.due_date as string))
    .slice(0, UPCOMING_LIMIT);
}

export default function SummaryPage() {
  const { user } = useAuth();
  const pending = useApiData("tasks:belum_selesai", () =>
    listTasks("belum_selesai"),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Ringkasan</h1>
        <p className="mt-1 text-sm text-muted">
          {isAdmin(user)
            ? "Statistik seluruh tugas tim."
            : "Statistik tugas yang kamu buat atau yang ditugaskan kepadamu."}
        </p>
      </div>

      <TaskSummaryPanel />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">Deadline terdekat</h2>
        {pending.status === "error" ? (
          <StateMessage title={errorMessage(pending.error)}>
            <Button onClick={pending.reload}>Coba lagi</Button>
          </StateMessage>
        ) : pending.status === "loading" ? (
          <Spinner label="Memuat deadline..." />
        ) : upcoming(pending.data).length === 0 ? (
          <StateMessage title="Tidak ada tugas belum selesai yang punya deadline." />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {upcoming(pending.data).map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="min-w-0">
                    <span className="block break-words font-medium text-ink">
                      {task.title}
                    </span>
                    <span className="text-xs text-muted">
                      <TaskDates task={task} />
                    </span>
                  </span>
                  {task.is_overdue && <OverdueBadge />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
