"use client";

import { useState, type FormEvent } from "react";
import { addTaskTag, createTag, errorMessage } from "../../lib/api";
import type { Tag, Task } from "../../lib/types";
import {
  sameTagName,
  TAG_NAME_MAX_LENGTH,
  validateTagName,
} from "../../lib/validation";
import { Button } from "../ui/Button";
import { inputClassName } from "../ui/Field";

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
      created = await createTag(name.trim());
    } catch (caught) {
      setError(errorMessage(caught, "name"));
      setBusy(false);
      return;
    }

    onTagCreated(created);

    if (await attach(created)) {
      setName("");
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
                className="inline-flex max-w-full items-center gap-1 rounded-md border border-dashed border-line-strong px-2 py-1 text-xs font-medium text-muted hover:border-accent hover:text-ink disabled:opacity-50"
              >
                <span aria-hidden>+</span>
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
      </form>
    </div>
  );
}
