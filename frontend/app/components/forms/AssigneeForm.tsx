"use client";

import { useState, type FormEvent } from "react";
import { addAssignee, errorMessage } from "../../lib/api";
import type { Task, UserSummary } from "../../lib/types";
import { Button } from "../ui/Button";
import { inputClassName } from "../ui/Field";

interface AssigneeFormProps {
  task: Task;
  users: UserSummary[];
  onAdded: (task: Task) => void;
}

export function AssigneeForm({ task, users, onAdded }: AssigneeFormProps) {
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const options = users.filter(
    (user) => !task.assignees.some((assignee) => assignee.id === user.id),
  );

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted">
        Semua user sudah menjadi assignee tugas ini.
      </p>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId) {
      setError("User wajib dipilih.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      onAdded(await addAssignee(task.id, Number(userId)));
      setUserId("");
    } catch (caught) {
      setError(errorMessage(caught, "user_id"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-2">
      <label htmlFor="assignee-user" className="sr-only">
        Pilih user untuk ditugaskan
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          id="assignee-user"
          value={userId}
          onChange={(event) => {
            setUserId(event.target.value);
            setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "assignee-user-error" : undefined}
          className={inputClassName(Boolean(error))}
        >
          <option value="">+ Pilih user</option>
          {options.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <Button type="submit" loading={submitting} className="shrink-0">
          Tambah
        </Button>
      </div>
      {error && (
        <p id="assignee-user-error" className="text-xs text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
