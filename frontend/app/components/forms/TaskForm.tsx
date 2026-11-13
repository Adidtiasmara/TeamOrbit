"use client";

import { useState, type FormEvent } from "react";
import { ApiError, createTask, errorMessage } from "../../lib/api";
import type { Task } from "../../lib/types";
import {
  TITLE_MAX_LENGTH,
  titleLength,
  validateTitle,
} from "../../lib/validation";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { errorId, Field, inputClassName } from "../ui/Field";

interface TaskFormProps {
  onCreated: (task: Task) => void;
  onCancel: () => void;
}

export function TaskForm({ onCreated, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState<{
    title?: string;
    description?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const length = titleLength(title);
  const titleError = (touched ? validateTitle(title) : null) ?? serverErrors.title;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    setServerErrors({});
    setFormError(null);

    if (validateTitle(title)) {
      return;
    }

    setSubmitting(true);

    try {
      onCreated(
        await createTask({
          title: title.trim(),
          description: description.trim() || null,
        }),
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setServerErrors({
          title: error.fieldError("title"),
          description: error.fieldError("description"),
        });
      } else {
        setFormError(errorMessage(error));
      }

      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4 px-5 py-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Field
          id="task-title"
          label={
            <>
              Judul{" "}
              <span className="font-normal text-muted">
                (wajib, maks. {TITLE_MAX_LENGTH} karakter)
              </span>
            </>
          }
          error={titleError}
        >
          <input
            id="task-title"
            type="text"
            data-autofocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={Boolean(titleError)}
            aria-describedby={`task-title-counter${titleError ? ` ${errorId("task-title")}` : ""}`}
            className={inputClassName(Boolean(titleError))}
          />
        </Field>
        <p
          id="task-title-counter"
          aria-live="polite"
          className={`-mt-2 text-right text-xs ${
            length > TITLE_MAX_LENGTH ? "font-medium text-danger" : "text-muted"
          }`}
        >
          {length} / {TITLE_MAX_LENGTH}
        </p>

        <Field
          id="task-description"
          label={
            <>
              Deskripsi <span className="font-normal text-muted">(opsional)</span>
            </>
          }
          error={serverErrors.description}
        >
          <textarea
            id="task-description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={inputClassName(Boolean(serverErrors.description))}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
        <Button onClick={onCancel} disabled={submitting}>
          Batal
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Simpan
        </Button>
      </div>
    </form>
  );
}
