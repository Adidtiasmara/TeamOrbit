import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskForm } from "../app/components/forms/TaskForm";
import { ApiError } from "../app/lib/api";
import { DUE_BEFORE_START_ERROR, TITLE_ERROR } from "../app/lib/validation";
import { makeTask } from "./fixtures";

const mocks = vi.hoisted(() => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock("../app/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../app/lib/api")>()),
  createTask: mocks.createTask,
  updateTask: mocks.updateTask,
}));

function titleInput(): HTMLInputElement {
  return screen.getByLabelText(/Judul/) as HTMLInputElement;
}

describe("TaskForm", () => {
  beforeEach(() => {
    mocks.createTask.mockReset();
    mocks.updateTask.mockReset();
  });

  it("menampilkan penghitung dan menolak judul 101 karakter tanpa memanggil API", async () => {
    const user = userEvent.setup();
    render(<TaskForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText("0 / 100")).toBeTruthy();

    fireEvent.change(titleInput(), { target: { value: "a".repeat(101) } });
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(screen.getByText("101 / 100")).toBeTruthy();
    expect(screen.getByText(TITLE_ERROR)).toBeTruthy();
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("menolak judul yang hanya berisi spasi", async () => {
    const user = userEvent.setup();
    render(<TaskForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    await user.type(titleInput(), "     ");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(screen.getByText(TITLE_ERROR)).toBeTruthy();
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("membuat tugas dengan judul yang sudah di-trim", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const created = makeTask({ title: "Siapkan laporan" });
    mocks.createTask.mockResolvedValue(created);
    render(<TaskForm onSaved={onSaved} onCancel={vi.fn()} />);

    await user.type(titleInput(), "   Siapkan laporan   ");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(mocks.createTask).toHaveBeenCalledWith({
      title: "Siapkan laporan",
      description: null,
      start_date: null,
      due_date: null,
    });
    expect(onSaved).toHaveBeenCalledWith(created);
  });

  it("mengirim tanggal mulai dan deadline", async () => {
    const user = userEvent.setup();
    mocks.createTask.mockResolvedValue(makeTask());
    render(<TaskForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    await user.type(titleInput(), "Rilis v1");
    fireEvent.change(screen.getByLabelText(/Tanggal mulai/), {
      target: { value: "2026-11-20" },
    });
    fireEvent.change(screen.getByLabelText(/Deadline/), {
      target: { value: "2026-11-25" },
    });
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(mocks.createTask).toHaveBeenCalledWith({
      title: "Rilis v1",
      description: null,
      start_date: "2026-11-20",
      due_date: "2026-11-25",
    });
  });

  it("menolak deadline sebelum tanggal mulai tanpa memanggil API", async () => {
    const user = userEvent.setup();
    render(<TaskForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    await user.type(titleInput(), "Rilis v1");
    fireEvent.change(screen.getByLabelText(/Tanggal mulai/), {
      target: { value: "2026-11-25" },
    });
    fireEvent.change(screen.getByLabelText(/Deadline/), {
      target: { value: "2026-11-20" },
    });
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(screen.getByText(DUE_BEFORE_START_ERROR)).toBeTruthy();
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("mode edit: terisi data lama dan memanggil updateTask", async () => {
    const user = userEvent.setup();
    const task = makeTask({
      id: 7,
      title: "Judul lama",
      description: "Lama",
      due_date: "2026-11-30",
    });
    mocks.updateTask.mockResolvedValue({ ...task, title: "Judul baru" });
    render(<TaskForm task={task} onSaved={vi.fn()} onCancel={vi.fn()} />);

    expect(titleInput().value).toBe("Judul lama");

    await user.clear(titleInput());
    await user.type(titleInput(), "Judul baru");
    await user.click(screen.getByRole("button", { name: "Simpan perubahan" }));

    expect(mocks.updateTask).toHaveBeenCalledWith(7, {
      title: "Judul baru",
      description: "Lama",
      start_date: null,
      due_date: "2026-11-30",
    });
    expect(mocks.createTask).not.toHaveBeenCalled();
  });

  it("menampilkan error validasi dari server (422)", async () => {
    const user = userEvent.setup();
    mocks.createTask.mockRejectedValue(
      new ApiError(422, "Validasi gagal.", {
        title: ["Judul dari server ditolak."],
      }),
    );
    render(<TaskForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    await user.type(titleInput(), "Judul valid");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Judul dari server ditolak.")).toBeTruthy();
  });
});
