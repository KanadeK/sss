import type {
  ExposureResult,
  ExposureSample,
  HeatmapCell,
  HeatmapResult,
  MonthlyExposure,
  RoomGrid,
  Scenario,
  SolarSample,
  SunInterval,
  TargetPoint,
} from "./types";
import { daysInYear, dateFromDayOfYear, formatLocalMinute, parseDate } from "./time";
import { sampleSolarDay } from "./solar";
import { validateRoomGrid, validateScenario } from "./validate";
import { projectSunThroughWindow } from "./window";

function buildIntervals(samples: ExposureSample[], stepMinutes: number): SunInterval[] {
  const intervals: SunInterval[] = [];
  let start: number | null = null;

  for (const sample of samples) {
    if (sample.direct && start === null) {
      start = sample.localMinute;
    }
    if (!sample.direct && start !== null) {
      intervals.push({
        startMinute: start,
        endMinute: sample.localMinute,
        startLabel: formatLocalMinute(start),
        endLabel: formatLocalMinute(sample.localMinute),
      });
      start = null;
    }
  }

  if (start !== null) {
    const end = Math.min(1_440, (samples.at(-1)?.localMinute ?? 0) + stepMinutes);
    intervals.push({
      startMinute: start,
      endMinute: end,
      startLabel: formatLocalMinute(start),
      endLabel: formatLocalMinute(end),
    });
  }
  return intervals;
}

export function evaluateTarget(
  solarSamples: SolarSample[],
  scenario: Scenario,
  target: TargetPoint = scenario.target,
): ExposureResult {
  const samples: ExposureSample[] = solarSamples.map((sample) => ({
    ...sample,
    ...projectSunThroughWindow(sample, scenario.window, target),
  }));
  const directSamples = samples.filter((sample) => sample.direct);
  const daylightSamples = samples.filter((sample) => sample.altitudeDeg > 0);
  const peak =
    directSamples.reduce<ExposureSample | null>(
      (best, sample) =>
        best === null || sample.incidenceCosine > best.incidenceCosine ? sample : best,
      null,
    ) ?? null;

  return {
    date: scenario.date,
    totalMinutes: directSamples.length * scenario.stepMinutes,
    daylightMinutes: daylightSamples.length * scenario.stepMinutes,
    weightedHours:
      directSamples.reduce((total, sample) => total + sample.incidenceCosine, 0) *
      (scenario.stepMinutes / 60),
    intervals: buildIntervals(samples, scenario.stepMinutes),
    peak,
    samples,
  };
}

export function simulateDay(scenario: Scenario): ExposureResult {
  validateScenario(scenario);
  return evaluateTarget(
    sampleSolarDay(scenario.site, scenario.date, scenario.stepMinutes),
    scenario,
  );
}

export function buildRoomHeatmap(scenario: Scenario, room: RoomGrid): HeatmapResult {
  validateScenario(scenario);
  validateRoomGrid(room);
  const solarSamples = sampleSolarDay(scenario.site, scenario.date, scenario.stepMinutes);
  const cells: HeatmapCell[] = [];
  let maxMinutes = 0;

  for (let row = 0; row < room.rows; row += 1) {
    const depthM = 0.05 + (row / (room.rows - 1)) * (room.depthM - 0.05);
    for (let column = 0; column < room.columns; column += 1) {
      const lateralM = -room.widthM / 2 + (column / (room.columns - 1)) * room.widthM;
      const result = evaluateTarget(solarSamples, scenario, {
        lateralM,
        depthM,
        heightM: room.targetHeightM,
      });
      maxMinutes = Math.max(maxMinutes, result.totalMinutes);
      cells.push({ lateralM, depthM, minutes: result.totalMinutes });
    }
  }

  return { cells, columns: room.columns, rows: room.rows, maxMinutes };
}

export function buildAnnualProfile(scenario: Scenario): MonthlyExposure[] {
  validateScenario(scenario);
  const { year } = parseDate(scenario.date);
  const buckets = Array.from({ length: 12 }, () => [] as number[]);
  const annualStep = Math.max(10, scenario.stepMinutes);

  for (let dayIndex = 0; dayIndex < daysInYear(year); dayIndex += 1) {
    const date = dateFromDayOfYear(year, dayIndex);
    const monthlyScenario = { ...scenario, date, stepMinutes: annualStep };
    const minutes = simulateDay(monthlyScenario).totalMinutes;
    const month = Number(date.slice(5, 7)) - 1;
    buckets[month]?.push(minutes);
  }

  return buckets.map((values, index) => ({
    month: index + 1,
    averageMinutes:
      values.length === 0
        ? 0
        : Math.round(values.reduce((total, value) => total + value, 0) / values.length),
    minMinutes: values.length === 0 ? 0 : Math.min(...values),
    maxMinutes: values.length === 0 ? 0 : Math.max(...values),
    daysWithSun: values.filter((value) => value > 0).length,
    days: values.length,
  }));
}
