import type { SolarPosition, TargetPoint, WindowGeometry, WindowHit } from "./types";

const radians = Math.PI / 180;
const epsilon = 1e-9;

function horizontalVector(azimuthDeg: number): [east: number, north: number] {
  const azimuth = azimuthDeg * radians;
  return [Math.sin(azimuth), Math.cos(azimuth)];
}

function dot(left: [number, number], right: [number, number]): number {
  return left[0] * right[0] + left[1] * right[1];
}

/**
 * Traces a ray from an indoor target toward the sun and checks whether it passes
 * through the rectangular window aperture.
 */
export function projectSunThroughWindow(
  sun: SolarPosition,
  window: WindowGeometry,
  target: TargetPoint,
): WindowHit {
  if (sun.altitudeDeg <= 0) {
    return { direct: false, windowX: null, windowZ: null, incidenceCosine: 0 };
  }

  const altitude = sun.altitudeDeg * radians;
  const sunHorizontal = horizontalVector(sun.azimuthDeg);
  const outwardNormal = horizontalVector(window.azimuthDeg);
  const windowRight = horizontalVector(window.azimuthDeg + 90);
  const horizontalMagnitude = Math.cos(altitude);
  const outwardComponent = horizontalMagnitude * dot(sunHorizontal, outwardNormal);

  if (outwardComponent <= epsilon) {
    return { direct: false, windowX: null, windowZ: null, incidenceCosine: 0 };
  }

  const travel = target.depthM / outwardComponent;
  const lateralComponent = horizontalMagnitude * dot(sunHorizontal, windowRight);
  const windowX = target.lateralM + travel * lateralComponent;
  const windowZ = target.heightM + travel * Math.sin(altitude);
  const halfWidth = window.widthM / 2;
  const top = window.sillHeightM + window.heightM;
  const direct =
    windowX >= -halfWidth - epsilon &&
    windowX <= halfWidth + epsilon &&
    windowZ >= window.sillHeightM - epsilon &&
    windowZ <= top + epsilon;

  return {
    direct,
    windowX,
    windowZ,
    incidenceCosine: outwardComponent,
  };
}
