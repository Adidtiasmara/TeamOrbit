interface TagChipProps {
  name: string;
  size?: "sm" | "md";
  /** Diisi untuk menampilkan tombol lepas tag. */
  onRemove?: () => void;
  removing?: boolean;
}

export function TagChip({
  name,
  size = "md",
  onRemove,
  removing = false,
}: TagChipProps) {
  const sizes = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs";

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-md border border-line bg-surface-2 font-medium text-ink ${sizes}`}
    >
      <span aria-hidden className="text-muted">
        #
      </span>
      <span className="truncate">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label={`Lepas tag ${name}`}
          className="-mr-0.5 rounded p-0.5 text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-50"
        >
          <svg
            aria-hidden
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
