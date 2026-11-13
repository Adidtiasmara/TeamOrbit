import { initials } from "../../lib/format";

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "size-6 text-[10px]",
    md: "size-8 text-xs",
    lg: "size-16 text-xl",
  }[size];

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-done ${sizes}`}
    >
      {initials(name)}
    </span>
  );
}
