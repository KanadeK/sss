import { describe, expect, it } from "vitest";
import {
  exposureToCsv,
  exposureToJson,
  simulateDay,
  validateRoomGrid,
  validateScenario,
  type Scenario,
} from "../src/core";

const scenario: Scenario = {
  name: "Export test",
  site: { latitude: 0, longitude: 0, timeZone: "UTC" },
  window: { azimuthDeg: 180, widthM: 2, heightM: 2, sillHeightM: 0.5 },
  target: { lateralM: 0, depthM: 1, heightM: 0.5 },
  date: "2026-03-20",
  stepMinutes: 30,
};

describe("exports and validation", () => {
  it("exports deterministic CSV and JSON", () => {
    const result = simulateDay(scenario);
    const csv = exposureToCsv(result);
    expect(csv.split("\n")[0]).toContain("sun_azimuth_deg");
    expect(csv).toContain("direct_sun");

    const json = JSON.parse(exposureToJson(scenario, result)) as {
      schemaVersion: number;
      summary: { totalMinutes: number };
    };
    expect(json.schemaVersion).toBe(1);
    expect(json.summary.totalMinutes).toBe(result.totalMinutes);
  });

  it("rejects unsafe or impossible inputs", () => {
    expect(() =>
      validateScenario({
        ...scenario,
        site: { ...scenario.site, latitude: 91 },
      }),
    ).toThrow("Latitude");
    expect(() =>
      validateScenario({
        ...scenario,
        window: { ...scenario.window, widthM: 0 },
      }),
    ).toThrow("Window width");
    expect(() =>
      validateScenario({
        ...scenario,
        stepMinutes: 0,
      }),
    ).toThrow("Step minutes");
    expect(() =>
      validateRoomGrid({
        widthM: 4,
        depthM: 3,
        targetHeightM: 1,
        columns: 1,
        rows: 3,
      }),
    ).toThrow("Heatmap columns");
  });
});
