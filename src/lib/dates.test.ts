import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { formatIsoDate, isIsoDate, toIsoDate } from "./dates";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("toIsoDate", () => {
  it.each([
    [new Date(2026, 0, 5), "2026-01-05"],
    [new Date(2026, 10, 14, 9, 30), "2026-11-14"],
    [new Date(2026, 11, 31, 23, 59, 59), "2026-12-31"],
  ])("formats %s as the local calendar day %s", (date, iso) => {
    expect(toIsoDate(date)).toBe(iso);
  });
});

describe("isIsoDate", () => {
  it.each(["2022-04-01", "2024-02-29", "2026-12-31"])(
    "accepts the calendar date %s",
    (value) => {
      expect(isIsoDate(value)).toBe(true);
    },
  );

  it.each([
    ["a day February lacks", "2022-02-30"],
    ["a leap day in a common year", "2023-02-29"],
    ["a 31st in a 30-day month", "2022-04-31"],
    ["month zero", "2022-00-10"],
    ["an unpadded month", "2022-4-01"],
    ["the brief's MM-DD-YYYY", "04-01-2022"],
    ["a timestamp", "2022-04-01T00:00"],
    ["a year alone", "2022"],
    ["a month alone", "2022-04"],
  ])("rejects %s", (_, value) => {
    expect(isIsoDate(value)).toBe(false);
  });
});

describe("formatIsoDate", () => {
  it.each([
    ["2022-04-01", "01 April 2022"],
    ["2026-01-05", "05 January 2026"],
    ["2026-12-31", "31 December 2026"],
  ])("formats %s as %s", (isoDate, formatted) => {
    expect(formatIsoDate(isoDate)).toBe(formatted);
  });

  it("keeps the calendar day west of UTC", async () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    vi.resetModules();
    const dates = await import("./dates");

    expect(dates.formatIsoDate("2022-04-01")).toBe("01 April 2022");
  });
});
