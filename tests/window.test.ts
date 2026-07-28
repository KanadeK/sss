import { describe, expect, it } from "vitest";
import { projectSunThroughWindow } from "../src/core";

const window = {
  azimuthDeg: 180,
  widthM: 2,
  heightM: 2,
  sillHeightM: 0.5,
};
const target = { lateralM: 0, depthM: 1, heightM: 0.5 };

describe("window ray projection", () => {
  it("passes a centered southern ray through the aperture", () => {
    const hit = projectSunThroughWindow(
      { azimuthDeg: 180, altitudeDeg: 30 },
      window,
      target,
    );
    expect(hit.direct).toBe(true);
    expect(hit.windowX).toBeCloseTo(0, 5);
    expect(hit.windowZ).toBeCloseTo(1.077, 2);
    expect(hit.incidenceCosine).toBeGreaterThan(0.8);
  });

  it("rejects rays behind the wall, below the horizon, and outside the aperture", () => {
    expect(
      projectSunThroughWindow({ azimuthDeg: 0, altitudeDeg: 30 }, window, target).direct,
    ).toBe(false);
    expect(
      projectSunThroughWindow({ azimuthDeg: 180, altitudeDeg: -1 }, window, target).direct,
    ).toBe(false);
    expect(
      projectSunThroughWindow({ azimuthDeg: 180, altitudeDeg: 75 }, window, {
        ...target,
        depthM: 4,
      }).direct,
    ).toBe(false);
  });

  it("accounts for lateral offset and oblique rays", () => {
    const centered = projectSunThroughWindow(
      { azimuthDeg: 200, altitudeDeg: 20 },
      { ...window, widthM: 3 },
      { ...target, lateralM: 0.4 },
    );
    expect(centered.windowX).not.toBeNull();
    expect(centered.windowX).not.toBeCloseTo(0.4, 2);
  });
});
