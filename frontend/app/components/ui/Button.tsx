import type { ButtonHTMLAttributes } from "react";
import { SpinnerIcon } from "./Icons";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-ink hover:opacity-90",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-2",
  danger: "bg-danger-soft text-danger hover:opacity-90",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink",
};

/** Kelas tombol, juga dipakai untuk <Link> yang tampil seperti tombol. */
export function buttonClassName(variant: Variant = "secondary"): string {
  return `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  block?: boolean;
}

export function Button({
  variant = "secondary",
  loading = false,
  block = false,
  disabled,
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClassName(variant)} ${block ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading && <SpinnerIcon />}
      {children}
    </button>
  );
}
