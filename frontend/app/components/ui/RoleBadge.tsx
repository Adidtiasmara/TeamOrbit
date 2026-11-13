import { ROLE_LABELS } from "../../lib/format";
import type { Role } from "../../lib/types";

export function RoleBadge({ role }: { role: Role }) {
  const tone =
    role === "admin"
      ? "bg-primary text-primary-ink"
      : "border border-line bg-surface-2 text-muted";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
