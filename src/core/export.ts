import type { ExposureResult, Scenario } from "./types";

function csvCell(value: string | number | boolean | null): string {
  if (value === null) {
    return "";
  }
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function exposureToCsv(result: ExposureResult): string {
  const header = [
    "local_minute",
    "instant_utc",
    "sun_azimuth_deg",
    "sun_altitude_deg",
    "direct_sun",
    "window_x_m",
    "window_z_m",
    "incidence_cosine",
  ];
  const rows = result.samples.map((sample) =>
    [
      sample.localMinute,
      sample.instantIso,
      sample.azimuthDeg.toFixed(4),
      sample.altitudeDeg.toFixed(4),
      sample.direct,
      sample.windowX === null ? null : sample.windowX.toFixed(4),
      sample.windowZ === null ? null : sample.windowZ.toFixed(4),
      sample.incidenceCosine.toFixed(6),
    ]
      .map(csvCell)
      .join(","),
  );
  return `${header.join(",")}\n${rows.join("\n")}\n`;
}

export function exposureToJson(
  scenario: Scenario,
  result: ExposureResult,
  pretty = true,
): string {
  return JSON.stringify(
    {
      schemaVersion: 1,
      scenario,
      summary: {
        totalMinutes: result.totalMinutes,
        daylightMinutes: result.daylightMinutes,
        weightedHours: Number(result.weightedHours.toFixed(3)),
        intervals: result.intervals,
        peak: result.peak,
      },
      samples: result.samples,
    },
    null,
    pretty ? 2 : undefined,
  );
}
