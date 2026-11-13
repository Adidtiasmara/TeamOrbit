/** Lingkaran berputar penanda proses. Warna default mengikuti warna teks. */
export function SpinnerIcon({
  className = "border-current",
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`size-4 animate-spin rounded-full border-2 border-t-transparent ${className}`}
    />
  );
}

/** Ikon silang untuk tombol tutup/hapus. Tombolnya yang memberi aria-label. */
export function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
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
  );
}
