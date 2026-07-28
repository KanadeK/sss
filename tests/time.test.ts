import { describe, expect, it } from "vitest";
import {
  assertTimeZone,
  dateFromDayOfYear,
  daysInYear,
  formatLocalMinute,
  getTimeZoneOffsetMinutes,
  parseDate,
  zonedDateTimeToUtc,
} from "../src/core";

describe("time helpers", () => {
  it("parses and rejects calendar dates", () => {
    expect(parseDate("2026-07-28")).toEqual({ year: 2026, month: 7, day: 28 });
    expect(() => parseDate("2026-02-30")).toThrow("Invalid calendar date");
    expect(() => parseDate("28/07/2026")).toThrow("Expected YYYY-MM-DD");
  });

  it("resolves IANA offsets including daylight saving time", () => {
    expect(
      getTimeZoneOffsetMinutes(new Date("2026-01-15T12:00:00Z"), "Europe/London"),
    ).toBe(0);
    expect(
      getTimeZoneOffsetMinutes(new Date("2026-07-15T12:00:00Z"), "Europe/London"),
    ).toBe(60);
    expect(zonedDateTimeToUtc("2026-07-15", 12 * 60, "Europe/London").toISOString()).toBe(
      "2026-07-15T11:00:00.000Z",
    );
  });

  it("validates time zones and formats minutes", () => {
    expect(() => assertTimeZone("Asia/Tokyo")).not.toThrow();
    expect(() => assertTimeZone("Mars/Olympus")).toThrow("Unknown IANA");
    expect(formatLocalMinute(0)).toBe("00:00");
    expect(formatLocalMinute(1_440)).toBe("24:00");
    expect(formatLocalMinute(754)).toBe("12:34");
  });

  it("handles leap years and day indexes", () => {
    expect(daysInYear(2024)).toBe(366);
    expect(daysInYear(2026)).toBe(365);
    expect(dateFromDayOfYear(2026, 0)).toBe("2026-01-01");
    expect(dateFromDayOfYear(2026, 364)).toBe("2026-12-31");
  });
});
