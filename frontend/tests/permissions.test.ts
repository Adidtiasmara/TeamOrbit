import { describe, expect, it } from "vitest";
import { canManageTask, isAdmin } from "../app/lib/permissions";
import { admin, ani, budi, makeTask } from "./fixtures";

describe("isAdmin", () => {
  it("hanya true untuk role admin", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(budi)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
});

describe("canManageTask (sama dengan TaskPolicy backend)", () => {
  const task = makeTask({
    created_by: { id: budi.id, name: budi.name },
    assignees: [],
  });

  it("Admin boleh mengelola tugas siapa pun", () => {
    expect(canManageTask(admin, task)).toBe(true);
  });

  it("pembuat tugas boleh mengelola", () => {
    expect(canManageTask(budi, task)).toBe(true);
  });

  it("assignee boleh mengelola", () => {
    const assigned = makeTask({ assignees: [{ id: ani.id, name: ani.name }] });

    expect(canManageTask(ani, assigned)).toBe(true);
  });

  it("Member lain tidak boleh, begitu juga tamu", () => {
    expect(canManageTask(ani, task)).toBe(false);
    expect(canManageTask(null, task)).toBe(false);
  });

  it("tugas tanpa pembuat (akun dihapus) hanya bisa dikelola Admin/assignee", () => {
    const orphan = makeTask({ created_by: null });

    expect(canManageTask(budi, orphan)).toBe(false);
    expect(canManageTask(admin, orphan)).toBe(true);
  });
});
