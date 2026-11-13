import { STATUS_LABELS } from "../../lib/format";
import type { TaskStatus } from "../../lib/types";

export function StatusBadge({ status }: { status: TaskStatus }) {
  const tone =
    status === "selesai" ? "bg-done-soft text-done" : "bg-todo-soft text-todo";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Penanda tugas belum selesai yang sudah melewati deadline. */
export function OverdueBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-medium text-danger">
      Terlambat
    </span>
  );
}
