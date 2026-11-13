import type { TagColor } from "../../lib/types";
import { CloseIcon } from "./Icons";

/**
 * Warna chip per palet. Teks -800 di atas -100 (terang) dan -200 di atas
 * -950 (gelap) punya kontras di atas 4.5:1 (WCAG AA).
 * Ditulis lengkap supaya terbaca oleh Tailwind.
 */
export const TAG_CHIP_CLASSES: Record<TagColor, string> = {
  abu: "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
  merah: "border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  oranye: "border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200",
  kuning: "border-yellow-200 bg-yellow-100 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200",
  hijau: "border-green-200 bg-green-100 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
  biru: "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  ungu: "border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-200",
  merah_muda: "border-pink-200 bg-pink-100 text-pink-800 dark:border-pink-900 dark:bg-pink-950 dark:text-pink-200",
};

/** Bulatan contoh warna di pemilih warna. */
export const TAG_SWATCH_CLASSES: Record<TagColor, string> = {
  abu: "bg-gray-400",
  merah: "bg-red-500",
  oranye: "bg-orange-500",
  kuning: "bg-yellow-400",
  hijau: "bg-green-500",
  biru: "bg-blue-500",
  ungu: "bg-purple-500",
  merah_muda: "bg-pink-500",
};

interface TagChipProps {
  name: string;
  color?: TagColor;
  size?: "sm" | "md";
  /** Diisi untuk menampilkan tombol lepas tag. */
  onRemove?: () => void;
  removing?: boolean;
}

export function TagChip({
  name,
  color = "abu",
  size = "md",
  onRemove,
  removing = false,
}: TagChipProps) {
  const sizes = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs";

  return (
    <span
      data-color={color}
      className={`inline-flex max-w-full items-center gap-1 rounded-md border font-medium ${TAG_CHIP_CLASSES[color]} ${sizes}`}
    >
      <span aria-hidden className="opacity-70">
        #
      </span>
      <span className="truncate">{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label={`Lepas tag ${name}`}
          className="-mr-0.5 rounded p-0.5 opacity-70 hover:bg-danger-soft hover:text-danger hover:opacity-100 disabled:opacity-50"
        >
          <CloseIcon size={12} />
        </button>
      )}
    </span>
  );
}
