import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TagForm } from "../app/components/forms/TagForm";
import { TAG_NAME_ERROR } from "../app/lib/validation";
import { makeTag, makeTask } from "./fixtures";

const mocks = vi.hoisted(() => ({
  createTag: vi.fn(),
  addTaskTag: vi.fn(),
}));

vi.mock("../app/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../app/lib/api")>()),
  createTag: mocks.createTag,
  addTaskTag: mocks.addTaskTag,
}));

const urgent = makeTag(1, "urgent");
const desain = makeTag(2, "Desain");

function renderForm(attached = [desain]) {
  const task = makeTask({ id: 10, tags: attached });
  const props = {
    task,
    tags: [desain, urgent],
    onTagCreated: vi.fn(),
    onAttached: vi.fn(),
  };

  render(<TagForm {...props} />);

  return props;
}

async function submitName(name: string) {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/buat tag baru/i), name);
  await user.click(screen.getByRole("button", { name: "Tambah tag" }));
}

describe("TagForm", () => {
  beforeEach(() => {
    mocks.createTag.mockReset();
    mocks.addTaskTag.mockReset();
  });

  it("pilihan cepat hanya berisi tag yang belum terpasang", async () => {
    const user = userEvent.setup();
    const props = renderForm();
    mocks.addTaskTag.mockResolvedValue(
      makeTask({ id: 10, tags: [desain, urgent] }),
    );

    expect(screen.queryByRole("button", { name: "Pasang tag Desain" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Pasang tag urgent" }));

    expect(mocks.addTaskTag).toHaveBeenCalledWith(10, urgent.id);
    expect(props.onAttached).toHaveBeenCalled();
  });

  it("nama yang sudah ada (beda huruf besar) memasang tag lama, bukan membuat baru", async () => {
    renderForm();
    mocks.addTaskTag.mockResolvedValue(makeTask({ tags: [desain, urgent] }));

    await submitName("URGENT");

    expect(mocks.createTag).not.toHaveBeenCalled();
    expect(mocks.addTaskTag).toHaveBeenCalledWith(10, urgent.id);
  });

  it("nama baru: buat tag dulu lalu pasang ke tugas", async () => {
    const props = renderForm();
    const laporan = makeTag(3, "Laporan");
    mocks.createTag.mockResolvedValue(laporan);
    mocks.addTaskTag.mockResolvedValue(makeTask({ tags: [desain, laporan] }));

    await submitName("  Laporan  ");

    expect(mocks.createTag).toHaveBeenCalledWith("Laporan", "abu");
    expect(props.onTagCreated).toHaveBeenCalledWith(laporan);
    expect(mocks.addTaskTag).toHaveBeenCalledWith(10, laporan.id);
  });

  it("warna bisa dipilih dengan nama aksesibel, default Abu-abu", async () => {
    const user = userEvent.setup();
    renderForm();
    const laporan = makeTag(3, "Laporan", "biru");
    mocks.createTag.mockResolvedValue(laporan);
    mocks.addTaskTag.mockResolvedValue(makeTask({ tags: [desain, laporan] }));

    const abu = screen.getByRole("radio", { name: "Abu-abu" }) as HTMLInputElement;
    const biru = screen.getByRole("radio", { name: "Biru" }) as HTMLInputElement;
    expect(screen.getAllByRole("radio")).toHaveLength(8);
    expect(abu.checked).toBe(true);

    await user.click(biru);
    expect(biru.checked).toBe(true);
    expect(abu.checked).toBe(false);

    await submitName("Laporan");

    expect(mocks.createTag).toHaveBeenCalledWith("Laporan", "biru");
    // Setelah berhasil, pilihan kembali ke default.
    await vi.waitFor(() => expect(abu.checked).toBe(true));
  });

  it("menolak tag yang sudah terpasang tanpa memanggil API", async () => {
    renderForm();

    await submitName("desain");

    expect(screen.getByText("Tag sudah terpasang di tugas ini.")).toBeTruthy();
    expect(mocks.createTag).not.toHaveBeenCalled();
    expect(mocks.addTaskTag).not.toHaveBeenCalled();
  });

  it("menolak nama lebih dari 50 karakter", async () => {
    const user = userEvent.setup();
    renderForm();

    fireEvent.change(screen.getByLabelText(/buat tag baru/i), {
      target: { value: "x".repeat(51) },
    });
    await user.click(screen.getByRole("button", { name: "Tambah tag" }));

    expect(screen.getByText(TAG_NAME_ERROR)).toBeTruthy();
    expect(mocks.createTag).not.toHaveBeenCalled();
  });
});
