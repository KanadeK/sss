import type { RoomGrid, Scenario } from "./types";
import { assertTimeZone, parseDate } from "./time";

function inRange(label: string, value: number, minimum: number, maximum: number): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function positive(label: string, value: number, allowZero = false): void {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
    throw new Error(
      `${label} must be ${allowZero ? "zero or greater" : "greater than zero"}.`,
    );
  }
}

export function validateScenario(scenario: Scenario): void {
  inRange("Latitude", scenario.site.latitude, -90, 90);
  inRange("Longitude", scenario.site.longitude, -180, 180);
  assertTimeZone(scenario.site.timeZone);
  parseDate(scenario.date);
  inRange("Window azimuth", scenario.window.azimuthDeg, 0, 360);
  positive("Window width", scenario.window.widthM);
  positive("Window height", scenario.window.heightM);
  positive("Sill height", scenario.window.sillHeightM, true);
  positive("Target depth", scenario.target.depthM, true);
  positive("Target height", scenario.target.heightM, true);
  inRange("Step minutes", scenario.stepMinutes, 1, 60);
}

export function validateRoomGrid(room: RoomGrid): void {
  positive("Room width", room.widthM);
  positive("Room depth", room.depthM);
  positive("Heatmap height", room.targetHeightM, true);
  inRange("Heatmap columns", room.columns, 2, 64);
  inRange("Heatmap rows", room.rows, 2, 64);
}
