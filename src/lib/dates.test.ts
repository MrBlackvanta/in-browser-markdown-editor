import { describe, expect, it } from "vite-plus/test";
import { toIsoDate } from "./dates";

describe("toIsoDate", () => {
  it.each([
    [new Date(2026, 0, 5), "2026-01-05"],
    [new Date(2026, 10, 14, 9, 30), "2026-11-14"],
    [new Date(2026, 11, 31, 23, 59, 59), "2026-12-31"],
  ])("formats %s as the local calendar day %s", (date, iso) => {
    expect(toIsoDate(date)).toBe(iso);
  });
});
