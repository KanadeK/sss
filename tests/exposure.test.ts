import { describe, expect, it } from "vitest";
import {
  buildAnnualProfile,
  buildRoomHeatmap,
  evaluateTarget,
  simulateDay,
  type Scenario,
  type SolarSample,
} from "../src/core";

const scenario: Scenario = {
  name: "Test room",
  site: { latitude: 35.6762, longitude: 139.6503, timeZone: "Asia/Tokyo" },
  window: { azimuthDeg: 180, widthM: 2, heightM: 1.6, sillHeightM: 0.6 },
  target: { lateralM: 0, depthM: 1, heightM: 0.6 },
  date: "2026-10-15",
  stepMinutes: 10,
};

describe("exposure simulation", () => {
  it("produces real intervals and a peak sample", () => {
    const result = simulateDay(scenario);
    expect(result.totalMinutes).toBeGreaterThan(0);
    expect(result.totalMinutes).toBeLessThan(result.daylightMinutes);
    expect(result.intervals.length).toBeGreaterThan(0);
    expect(result.peak?.direct).toBe(true);
    expect(result.weightedHours).toBeGreaterThan(0);
  });

  it("merges adjacent samples into intervals and closes an end-of-day interval", () => {
    const solarSamples: SolarSample[] = [
      {
        localMinute: 1_420,
        instantIso: "2026-01-01T23:40:00.000Z",
        azimuthDeg: 180,
        altitudeDeg: 10,
      },
      {
        localMinute: 1_430,
        instantIso: "2026-01-01T23:50:00.000Z",
        azimuthDeg: 180,
        altitudeDeg: 10,
      },
    ];
    const result = evaluateTarget(solarSamples, {
      ...scenario,
      stepMinutes: 10,
      target: { lateralM: 0, depthM: 0, heightM: 1 },
    });
    expect(result.intervals).toEqual([
      {
        startMinute: 1_420,
        endMinute: 1_440,
        startLabel: "23:40",
        endLabel: "24:00",
      },
    ]);
  });

  it("builds a reusable room heatmap", () => {
    const heatmap = buildRoomHeatmap(scenario, {
      widthM: 4,
      depthM: 3,
      targetHeightM: 0.6,
      columns: 4,
      rows: 3,
    });
    expect(heatmap.cells).toHaveLength(12);
    expect(heatmap.maxMinutes).toBeGreaterThan(0);
    expect(heatmap.cells.some((cell) => cell.minutes === 0)).toBe(true);
  });

  it("builds all twelve annual buckets", () => {
    const profile = buildAnnualProfile({ ...scenario, stepMinutes: 30 });
    expect(profile).toHaveLength(12);
    expect(profile.reduce((sum, month) => sum + month.days, 0)).toBe(365);
    expect(profile.some((month) => month.maxMinutes > 0)).toBe(true);
  });
});
