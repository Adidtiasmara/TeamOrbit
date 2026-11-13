import { describe, expect, it } from "vitest";
import {
  DUE_BEFORE_START_ERROR,
  isValidEmail,
  sameTagName,
  TAG_NAME_ERROR,
  TITLE_ERROR,
  titleLength,
  validateDates,
  validateTagName,
  validateTitle,
} from "../app/lib/validation";

describe("validateDates", () => {
  it("menerima tanggal kosong, sama, atau deadline setelah mulai", () => {
    expect(validateDates("", "")).toBeNull();
    expect(validateDates("2026-11-20", "")).toBeNull();
    expect(validateDates("", "2026-11-20")).toBeNull();
    expect(validateDates("2026-11-20", "2026-11-20")).toBeNull();
    expect(validateDates("2026-11-20", "2026-12-01")).toBeNull();
  });

  it("menolak deadline sebelum tanggal mulai", () => {
    expect(validateDates("2026-11-20", "2026-11-19")).toBe(
      DUE_BEFORE_START_ERROR,
    );
  });
});

describe("validateTitle", () => {
  it("menolak judul kosong atau hanya spasi", () => {
    expect(validateTitle("")).toBe(TITLE_ERROR);
    expect(validateTitle("     ")).toBe(TITLE_ERROR);
  });

  it("menerima tepat 100 karakter setelah spasi di awal/akhir dibuang", () => {
    expect(validateTitle(`   ${"a".repeat(100)}   `)).toBeNull();
  });

  it("menolak 101 karakter", () => {
    expect(validateTitle("a".repeat(101))).toBe(TITLE_ERROR);
  });

  it("menghitung emoji sebagai satu karakter, sama dengan backend", () => {
    expect(titleLength("😀".repeat(100))).toBe(100);
    expect(validateTitle("😀".repeat(100))).toBeNull();
    expect(validateTitle("😀".repeat(101))).toBe(TITLE_ERROR);
  });
});

describe("validateTagName", () => {
  it("menolak nama kosong dan lebih dari 50 karakter", () => {
    expect(validateTagName("  ")).toBe(TAG_NAME_ERROR);
    expect(validateTagName("x".repeat(51))).toBe(TAG_NAME_ERROR);
  });

  it("menerima tepat 50 karakter", () => {
    expect(validateTagName("x".repeat(50))).toBeNull();
  });
});

describe("sameTagName", () => {
  it("tidak membedakan huruf besar/kecil dan spasi di tepi", () => {
    expect(sameTagName("Urgent", "  urgent ")).toBe(true);
    expect(sameTagName("desain", "design")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("mengenali format email dasar", () => {
    expect(isValidEmail("budi@teamorbit.test")).toBe(true);
    expect(isValidEmail("budi@")).toBe(false);
    expect(isValidEmail("budi teamorbit.test")).toBe(false);
  });
});
