export const TAGLINE = "Semua tugas tim dalam satu orbit.";

export function Brand({ withTagline = false }: { withTagline?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-ink"
      >
        T
      </span>
      <div className="leading-tight">
        <p className="text-base font-bold text-ink">TeamOrbit</p>
        {withTagline && <p className="text-xs text-muted">{TAGLINE}</p>}
      </div>
    </div>
  );
}
