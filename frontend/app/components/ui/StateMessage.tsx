import type { ReactNode } from "react";
import { SpinnerIcon } from "./Icons";

/** Pesan kosong/error/loading yang ditaruh di tengah area konten. */
export function StateMessage({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {children && <div className="mt-3 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Spinner({ label = "Memuat..." }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 py-10 text-sm text-muted"
    >
      <SpinnerIcon />
      {label}
    </div>
  );
}
