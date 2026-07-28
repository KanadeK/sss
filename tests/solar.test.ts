import { describe, expect, it } from "vitest";
import { getSolarPosition, sampleSolarDay } from "../src/core";

describe("solar position", () => {
  it("matches the NREL reference case within the compact model tolerance", () => {
    const position = getSolarPosition(
      new Date("2003-10-17T19:30:30Z"),
      39.742476,
      -105.1786,
    );
    expect(position.altitudeDeg).toBeCloseTo(39.888, 0);
    expect(position.azimuthDeg).toBeCloseTo(194.34, 0);
  });

  it("places the equinox noon sun close to overhead at the equator", () => {
    const position = getSolarPosition(new Date("2026-03-20T12:00:00Z"), 0, 0);
    expect(position.altitudeDeg).toBeGreaterThan(87);
  });

  it("samples a complete local day at the requested resolution", () => {
    const samples = sampleSolarDay(
      { latitude: 35.6762, longitude: 139.6503, timeZone: "Asia/Tokyo" },
      "2026-06-21",
      15,
    );
    expect(samples).toHaveLength(96);
    expect(samples[0]?.localMinute).toBe(0);
    expect(samples.at(-1)?.localMinute).toBe(1_425);
    expect(samples.some((sample) => sample.altitudeDeg > 70)).toBe(true);
  });
});
