import type { SolarPosition, SolarSample, Site } from "./types";
import { getTimeZoneOffsetMinutes, parseDate, zonedDateTimeToUtc } from "./time";

const radians = Math.PI / 180;
const degrees = 180 / Math.PI;
const dayMilliseconds = 86_400_000;
const julian1970 = 2_440_588;
const julian2000 = 2_451_545;
const obliquity = radians * 23.4397;

function rightAscension(longitude: number): number {
  return Math.atan2(Math.sin(longitude) * Math.cos(obliquity), Math.cos(longitude));
}

function declination(longitude: number): number {
  return Math.asin(Math.sin(obliquity) * Math.sin(longitude));
}

function solarMeanAnomaly(days: number): number {
  return radians * (357.5291 + 0.98560028 * days);
}

function eclipticLongitude(meanAnomaly: number): number {
  const center =
    radians *
    (1.9148 * Math.sin(meanAnomaly) +
      0.02 * Math.sin(2 * meanAnomaly) +
      0.0003 * Math.sin(3 * meanAnomaly));
  const perihelion = radians * 102.9372;
  return meanAnomaly + center + perihelion + Math.PI;
}

function toDays(instant: Date): number {
  return instant.getTime() / dayMilliseconds - 0.5 + julian1970 - julian2000;
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

/**
 * Compact Meeus-derived solar position approximation.
 * Azimuth is clockwise from true north; altitude is above the geometric horizon.
 */
export function getSolarPosition(
  instant: Date,
  latitude: number,
  longitude: number,
): SolarPosition {
  const longitudeWest = -longitude * radians;
  const latitudeRadians = latitude * radians;
  const days = toDays(instant);
  const meanAnomaly = solarMeanAnomaly(days);
  const ecliptic = eclipticLongitude(meanAnomaly);
  const solarDeclination = declination(ecliptic);
  const hourAngle =
    radians * (280.16 + 360.9856235 * days) - longitudeWest - rightAscension(ecliptic);

  const altitude = Math.asin(
    Math.sin(latitudeRadians) * Math.sin(solarDeclination) +
      Math.cos(latitudeRadians) * Math.cos(solarDeclination) * Math.cos(hourAngle),
  );
  const azimuthFromSouth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(latitudeRadians) -
      Math.tan(solarDeclination) * Math.cos(latitudeRadians),
  );

  return {
    azimuthDeg: normalizeDegrees(azimuthFromSouth * degrees + 180),
    altitudeDeg: altitude * degrees,
  };
}

export function sampleSolarDay(
  site: Site,
  date: string,
  stepMinutes: number,
): SolarSample[] {
  const samples: SolarSample[] = [];
  const { year, month, day } = parseDate(date);
  const start = zonedDateTimeToUtc(date, 0, site.timeZone);
  const noon = zonedDateTimeToUtc(date, 720, site.timeZone);
  const end = zonedDateTimeToUtc(date, 1_439, site.timeZone);
  const startOffset = getTimeZoneOffsetMinutes(start, site.timeZone);
  const noonOffset = getTimeZoneOffsetMinutes(noon, site.timeZone);
  const endOffset = getTimeZoneOffsetMinutes(end, site.timeZone);
  const hasClockChange = startOffset !== endOffset;

  for (let localMinute = 0; localMinute < 1_440; localMinute += stepMinutes) {
    const instant = hasClockChange
      ? zonedDateTimeToUtc(date, localMinute, site.timeZone)
      : new Date(
          Date.UTC(year, month - 1, day, Math.floor(localMinute / 60), localMinute % 60) -
            noonOffset * 60_000,
        );
    samples.push({
      ...getSolarPosition(instant, site.latitude, site.longitude),
      instantIso: instant.toISOString(),
      localMinute,
    });
  }
  return samples;
}
