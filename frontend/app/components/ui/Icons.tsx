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

/** Ikon garis 24×24; nama aksesibel diberikan oleh elemen pembungkusnya. */
function StrokeIcon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      className="shrink-0"
    >
      <path d={d} />
    </svg>
  );
}

type IconProps = { size?: number };

export const MenuIcon = (props: IconProps) => (
  <StrokeIcon {...props} d="M4 6h16M4 12h16M4 18h16" />
);

export const TasksIcon = (props: IconProps) => (
  <StrokeIcon
    {...props}
    d="M9 5h10M9 12h10M9 19h10M4.5 5l.75.75L6.75 4M4.5 12l.75.75L6.75 11M4.5 19l.75.75L6.75 18"
  />
);

export const ChartIcon = (props: IconProps) => (
  <StrokeIcon {...props} d="M4 20h16M7 16v-5M12 16V6M17 16v-8" />
);

export const UserIcon = (props: IconProps) => (
  <StrokeIcon
    {...props}
    d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0"
  />
);

export const UsersIcon = (props: IconProps) => (
  <StrokeIcon
    {...props}
    d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 20a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"
  />
);

export const ShieldIcon = (props: IconProps) => (
  <StrokeIcon
    {...props}
    d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3ZM9 12l2 2 4-4"
  />
);

export const LogoutIcon = (props: IconProps) => (
  <StrokeIcon
    {...props}
    d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"
  />
);
