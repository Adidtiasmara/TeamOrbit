import type { ReactNode } from "react";

export function inputClassName(invalid = false): string {
  return `w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 ${
    invalid ? "border-danger" : "border-line-strong focus:border-accent"
  }`;
}

interface FieldProps {
  id: string;
  label: ReactNode;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
}

/** Label + input + pesan error. Input-nya perlu aria-describedby={errorId(id)}. */
export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <div className="text-xs text-muted">{hint}</div>}
      {error && (
        <p id={errorId(id)} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function errorId(id: string): string {
  return `${id}-error`;
}
