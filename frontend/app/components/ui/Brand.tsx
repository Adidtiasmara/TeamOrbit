export const TAGLINE = "Semua tugas tim dalam satu orbit.";

export function Brand({
  withTagline = false,
  collapsed = false,
  admin = false,
}: {
  withTagline?: boolean;
  /** Rail sidebar desktop: hanya logo, teks disembunyikan mulai layar md. */
  collapsed?: boolean;
  /** Logo memakai warna aksen panel Admin. */
  admin?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
          admin ? "bg-admin text-admin-ink" : "bg-primary text-primary-ink"
        }`}
      >
        T
      </span>
      {/* Saat ciut teks hanya transparan (lebar tetap), supaya tinggi area
          brand tidak berubah dan menu di bawahnya tidak bergeser. */}
      <div
        className={`leading-tight ${
          collapsed
            ? "md:w-44 md:shrink-0 md:opacity-0 motion-safe:transition-opacity"
            : "min-w-0 md:w-44 md:shrink-0 motion-safe:transition-opacity"
        }`}
      >
        <p className="text-base font-bold text-ink">TeamOrbit</p>
        {withTagline && <p className="text-xs text-muted">{TAGLINE}</p>}
      </div>
    </div>
  );
}
