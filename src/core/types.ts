export interface Site {
  latitude: number;
  longitude: number;
  timeZone: string;
}

export interface WindowGeometry {
  /** Degrees clockwise from north, pointing from the room toward outdoors. */
  azimuthDeg: number;
  widthM: number;
  heightM: number;
  sillHeightM: number;
}

export interface TargetPoint {
  /** Positive to the right while standing inside and looking out. */
  lateralM: number;
  /** Perpendicular distance from the window plane into the room. */
  depthM: number;
  heightM: number;
}

export interface Scenario {
  name?: string;
  site: Site;
  window: WindowGeometry;
  target: TargetPoint;
  date: string;
  stepMinutes: number;
}

export interface SolarPosition {
  azimuthDeg: number;
  altitudeDeg: number;
}

export interface SolarSample extends SolarPosition {
  instantIso: string;
  localMinute: number;
}

export interface WindowHit {
  direct: boolean;
  windowX: number | null;
  windowZ: number | null;
  incidenceCosine: number;
}

export interface ExposureSample extends SolarSample, WindowHit {}

export interface SunInterval {
  startMinute: number;
  endMinute: number;
  startLabel: string;
  endLabel: string;
}

export interface ExposureResult {
  date: string;
  totalMinutes: number;
  daylightMinutes: number;
  weightedHours: number;
  intervals: SunInterval[];
  peak: ExposureSample | null;
  samples: ExposureSample[];
}

export interface RoomGrid {
  widthM: number;
  depthM: number;
  targetHeightM: number;
  columns: number;
  rows: number;
}

export interface HeatmapCell {
  lateralM: number;
  depthM: number;
  minutes: number;
}

export interface HeatmapResult {
  cells: HeatmapCell[];
  columns: number;
  rows: number;
  maxMinutes: number;
}

export interface MonthlyExposure {
  month: number;
  averageMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  daysWithSun: number;
  days: number;
}
