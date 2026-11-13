"use client";

import { useId, useState, type FormEvent } from "react";
import { addTaskTag, ApiError, createTag, errorMessage } from "../../lib/api";
import {
  DEFAULT_TAG_COLOR,
  TAG_COLOR_LABELS,
  TAG_COLORS,
} from "../../lib/format";
import type { Tag, TagColor, Task } from "../../lib/types";
import {
  sameTagName,
  TAG_NAME_MAX_LENGTH,
  validateTagName,
} from "../../lib/validation";
import { Button } from "../ui/Button";
import { inputClassName } from "../ui/Field";
import { CheckIcon } from "../ui/Icons";
import { TAG_SWATCH_CLASSES } from "../ui/TagChip";

/**
 * Pilihan warna dari palet berupa radio button: bisa dipakai dengan panah
 * keyboard, tiap warna punya nama, dan yang terpilih diberi tanda centang.
 */
export function TagColorPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: TagColor;
  onChange: (color: TagColor) => void;
  disabled?: boolean;
}) {
  const name = useId();

  return (
    <fieldset disabled={disabled} className="space-y-1.5">
      <legend className="text-xs text-muted">
        Warna tag baru: <span className="text-ink">{TAG_COLOR_LABELS[value]}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {TAG_COLORS.map((color) => {
          const checked = color === value;

          return (
            <label
              key={color}
              title={TAG_COLOR_LABELS[color]}
              className="cursor-pointer has-[:disabled]:cursor-not-allowed"
            >
              <input
                type="radio"
                name={name}
                value={color}
                checked={checked}
                onChange={() => onChange(color)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={`flex size-7 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent ${TAG_SWATCH_CLASSES[color]}`}
              >
                {checked && <CheckIcon size={16} />}
              </span>
              <span className="sr-only">{TAG_COLOR_LABELS[color]}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

interface TagFormProps {
  task: Task;
  /** Semua tag yang ada; kosong kalau daftar tag gagal dimuat. */
  tags: Tag[];
  onTagCreated: (tag: Tag) => void;
  onAttached: (task: Task) => void;
}

/**
 * Pasang tag yang sudah ada (klik chip), atau ketik nama untuk membuat tag
 * baru. Nama yang sudah ada (tanpa beda huruf besar/kecil) langsung dipasang.
 */
export function TagForm({ task, tags, onTagCreated, onAttached }: TagFormProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<TagColor>(DEFAULT_TAG_COLOR);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const available = tags.filter(
    (tag) => !task.tags.some((attached) => attached.id === tag.id),
  );

  const attach = async (tag: Tag) => {
    setBusy(true);
    setError(null);

    try {
      onAttached(await addTaskTag(task.id, tag.id));
      return true;
    } catch (caught) {
      setError(errorMessage(caught, "tag_id"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const invalid = validateTagName(name);

    if (invalid) {
      setError(invalid);
      return;
    }

    if (task.tags.some((tag) => sameTagName(tag.name, name))) {
      setError("Tag sudah terpasang di tugas ini.");
      return;
    }

    const existing = tags.find((tag) => sameTagName(tag.name, name));

    if (existing) {
      if (await attach(existing)) {
        setName("");
      }
      return;
    }

    setBusy(true);
    setError(null);

    let created: Tag;

    try {
      created = await createTag(name.trim(), color);
    } catch (caught) {
      setError(
        caught instanceof ApiError && !caught.fieldError("name")
          ? errorMessage(caught, "color")
          : errorMessage(caught, "name"),
      );
      setBusy(false);
      return;
    }

    onTagCreated(created);

    if (await attach(created)) {
      setName("");
      setColor(DEFAULT_TAG_COLOR);
    }
  };

  return (
    <div className="space-y-3">
      {available.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted">Pasang tag yang sudah ada:</p>
          <div className="flex flex-wrap gap-1.5">
            {available.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => attach(tag)}
                disabled={busy}
                aria-label={`Pasang tag ${tag.name}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-dashed border-line-strong px-2 py-1 text-xs font-medium text-muted hover:border-accent hover:text-ink disabled:opacity-50"
              >
                <span aria-hidden>+</span>
                <span
                  aria-hidden
                  className={`size-2 shrink-0 rounded-full ${TAG_SWATCH_CLASSES[tag.color]}`}
                />
                <span className="truncate">{tag.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-2">
        <label htmlFor="tag-name" className="block text-xs text-muted">
          {available.length > 0 ? "Atau buat tag baru" : "Buat tag baru"} (maks.{" "}
          {TAG_NAME_MAX_LENGTH} karakter):
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="tag-name"
            type="text"
            placeholder="mis. urgent, desain, laporan"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "tag-name-error" : undefined}
            className={inputClassName(Boolean(error))}
          />
          <Button type="submit" loading={busy} className="shrink-0">
            Tambah tag
          </Button>
        </div>
        {error && (
          <p id="tag-name-error" className="text-xs text-danger">
            {error}
          </p>
        )}
        <TagColorPicker value={color} onChange={setColor} disabled={busy} />
      </form>
    </div>
  );
}
