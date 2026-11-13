import { initials } from "../../lib/format";

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const sizes = size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs";

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-done ${sizes}`}
    >
      {initials(name)}
    </span>
  );
}
