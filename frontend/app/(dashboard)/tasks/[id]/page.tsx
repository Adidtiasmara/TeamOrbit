"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { TaskForm } from "../../../components/forms/TaskForm";
import {
  DeleteTaskDialog,
  TaskAssigneesPanel,
  TaskInfo,
  TaskTagsPanel,
} from "../../../components/tasks/TaskSections";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Spinner, StateMessage } from "../../../components/ui/StateMessage";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useApiData } from "../../../hooks/useApiData";
import { useAuth } from "../../../hooks/useAuth";
import {
  ApiError,
  errorMessage,
  getTask,
  listAssignableUsers,
  listTags,
  updateTask,
} from "../../../lib/api";
import { setFlash } from "../../../lib/flash";
import { canManageTask } from "../../../lib/permissions";
import type { Tag, UserSummary } from "../../../lib/types";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();

  // key: state di-reset saat pindah ke tugas lain.
  return <TaskDetail key={id} taskId={id} />;
}

function BackLink() {
  return (
    <Link
      href="/tasks"
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
    >
      <span aria-hidden>←</span> Kembali ke daftar tugas
    </Link>
  );
}

function loadErrorTitle(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "Tugas tidak ditemukan.";
  }

  if (error instanceof ApiError && error.status === 403) {
    return "Kamu tidak punya akses ke tugas ini.";
  }

  return errorMessage(error);
}

// Data pendukung: kalau gagal dimuat, dianggap kosong supaya halaman tetap jalan.
const loadUsers = () => listAssignableUsers().catch((): UserSummary[] => []);
const loadTags = () => listTags().catch((): Tag[] => []);

function TaskDetail({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const task = useApiData(`task:${taskId}`, () => getTask(taskId));
  const users = useApiData("assignable-users", loadUsers);
  const tags = useApiData("tags", loadTags);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (task.status === "error") {
    return (
      <div className="space-y-6">
        <BackLink />
        <StateMessage title={loadErrorTitle(task.error)} />
      </div>
    );
  }

  if (task.status === "loading") {
    return <Spinner label="Memuat tugas..." />;
  }

  const current = task.data;
  const done = current.status === "selesai";
  const canManage = canManageTask(user, current);

  const clearMessages = () => {
    setActionError(null);
    setNotice(null);
  };

  const leaveWith = (message: string) => {
    setFlash(message);
    router.replace("/tasks");
  };

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    clearMessages();

    try {
      task.setData(
        await updateTask(current.id, {
          status: done ? "belum_selesai" : "selesai",
        }),
      );
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setTogglingStatus(false);
    }
  };

  const panelProps = {
    task: current,
    canManage,
    onTaskChange: task.setData,
    onActionStart: clearMessages,
    onError: setActionError,
  };

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="min-w-0 break-words text-2xl font-bold text-ink">
            {current.title}
          </h1>
          <StatusBadge status={current.status} />
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleToggleStatus} loading={togglingStatus}>
              {done ? "Tandai belum selesai" : "Tandai selesai"}
            </Button>
            <Button
              onClick={() => {
                clearMessages();
                setEditOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearMessages();
                setDeleteOpen(true);
              }}
            >
              Hapus
            </Button>
          </div>
        )}
      </div>

      {actionError && <Alert tone="error">{actionError}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      <TaskInfo task={current} />

      <TaskTagsPanel
        {...panelProps}
        allTags={tags.data ?? []}
        onTagCreated={(tag) =>
          tags.setData((list) =>
            [...list, tag].sort((a, b) => a.name.localeCompare(b.name)),
          )
        }
      />

      <TaskAssigneesPanel
        {...panelProps}
        users={users.data ?? []}
        currentUserId={user?.id}
        onSelfRemoved={() =>
          leaveWith(`Kamu tidak lagi menjadi assignee tugas "${current.title}".`)
        }
      />

      <Modal open={editOpen} title="Edit tugas" onClose={() => setEditOpen(false)}>
        <TaskForm
          task={current}
          onSaved={(updated) => {
            setEditOpen(false);
            task.setData(updated);
            setNotice("Perubahan tugas disimpan.");
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <DeleteTaskDialog
        task={current}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => leaveWith(`Tugas "${current.title}" dihapus.`)}
      />
    </div>
  );
}
