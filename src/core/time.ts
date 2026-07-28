const formatterCache = new Map<string, Intl.DateTimeFormat>();

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export function parseDate(date: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error(`Invalid date "${date}". Expected YYYY-MM-DD.`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date "${date}".`);
  }

  return { year, month, day };
}

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatter.format(new Date(0));
    formatterCache.set(timeZone, formatter);
  }
  return formatter;
}

export function assertTimeZone(timeZone: string): void {
  try {
    getFormatter(timeZone);
  } catch {
    throw new Error(`Unknown IANA time zone "${timeZone}".`);
  }
}

export function getTimeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const values: Record<string, number> = {};
  for (const part of getFormatter(timeZone).formatToParts(instant)) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }

  const asUtc = Date.UTC(
    values.year ?? 0,
    (values.month ?? 1) - 1,
    values.day ?? 1,
    values.hour ?? 0,
    values.minute ?? 0,
    values.second ?? 0,
  );
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

export function zonedDateTimeToUtc(
  date: string,
  localMinute: number,
  timeZone: string,
): Date {
  assertTimeZone(timeZone);
  const { year, month, day } = parseDate(date);
  const hour = Math.floor(localMinute / 60);
  const minute = localMinute % 60;
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);

  let candidate = localAsUtc;
  for (let index = 0; index < 3; index += 1) {
    const offset = getTimeZoneOffsetMinutes(new Date(candidate), timeZone);
    candidate = localAsUtc - offset * 60_000;
  }
  return new Date(candidate);
}

export function formatLocalMinute(minute: number): string {
  const normalized = Math.max(0, Math.min(1_440, Math.round(minute)));
  if (normalized === 1_440) {
    return "24:00";
  }
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function daysInYear(year: number): number {
  return new Date(Date.UTC(year, 1, 29)).getUTCDate() === 29 ? 366 : 365;
}

export function dateFromDayOfYear(year: number, dayIndex: number): string {
  const date = new Date(Date.UTC(year, 0, dayIndex + 1));
  return date.toISOString().slice(0, 10);
}
