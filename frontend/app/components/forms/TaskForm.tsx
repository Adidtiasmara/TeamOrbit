"use client";

import { useState, type FormEvent } from "react";
import { ApiError, createTask, errorMessage, updateTask } from "../../lib/api";
import type { Task } from "../../lib/types";
import {
  TITLE_MAX_LENGTH,
  titleLength,
  validateDates,
  validateTitle,
} from "../../lib/validation";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { errorId, Field, inputClassName } from "../ui/Field";

interface TaskFormProps {
  /** Diisi untuk mode edit; kosong untuk membuat tugas baru. */
  task?: Task;
  onSaved: (task: Task) => void;
  onCancel: () => void;
}

type ServerField = "title" | "description" | "start_date" | "due_date";

const OPTIONAL = <span className="font-normal text-muted">(opsional)</span>;

export function TaskForm({ task, onSaved, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [startDate, setStartDate] = useState(task?.start_date ?? "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [touched, setTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState<
    Partial<Record<ServerField, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const length = titleLength(title);
  const titleError = (touched ? validateTitle(title) : null) ?? serverErrors.title;
  const dueError = validateDates(startDate, dueDate) ?? serverErrors.due_date;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    setServerErrors({});
    setFormError(null);

    if (validateTitle(title) || validateDates(startDate, dueDate)) {
      return;
    }

    setSubmitting(true);

    const input = {
      title: title.trim(),
      description: description.trim() || null,
      start_date: startDate || null,
      due_date: dueDate || null,
    };

    try {
      onSaved(await (task ? updateTask(task.id, input) : createTask(input)));
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setServerErrors({
          title: error.fieldError("title"),
          description: error.fieldError("description"),
          start_date: error.fieldError("start_date"),
          due_date: error.fieldError("due_date"),
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="task-start-date"
            label={<>Tanggal mulai {OPTIONAL}</>}
            error={serverErrors.start_date}
          >
            <input
              id="task-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              aria-invalid={Boolean(serverErrors.start_date)}
              className={inputClassName(Boolean(serverErrors.start_date))}
            />
          </Field>
          <Field
            id="task-due-date"
            label={<>Deadline {OPTIONAL}</>}
            error={dueError}
          >
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              min={startDate || undefined}
              onChange={(event) => setDueDate(event.target.value)}
              aria-invalid={Boolean(dueError)}
              aria-describedby={dueError ? errorId("task-due-date") : undefined}
              className={inputClassName(Boolean(dueError))}
            />
          </Field>
        </div>

        <Field
          id="task-description"
          label={<>Deskripsi {OPTIONAL}</>}
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
          {task ? "Simpan perubahan" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
