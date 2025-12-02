import { computeValue } from "../../../core/_internal";
import { Any, Options } from "../../../types";
import { assert, isDate, isNil, isNumber } from "../../../util";

export const TIME_UNITS = [
  "year",
  "quarter",
  "month",
  "week",
  "day",
  "hour",
  "minute",
  "second",
  "millisecond"
] as const;

/** Time unit for datetime periods */
export type TimeUnit = (typeof TIME_UNITS)[number];

const ISO_WEEKDAYS = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7
} as const;

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"
  | keyof typeof ISO_WEEKDAYS;

export const LEAP_YEAR_REF_POINT = -1000000000;
export const DAYS_PER_WEEK = 7;

export const isLeapYear = (y: number): boolean =>
  (y & 3) == 0 && (y % 100 != 0 || y % 400 == 0);

const DAYS_IN_YEAR = [365 /*common*/, 366 /*leap*/] as const;

const YEAR_DAYS_OFFSET = [
  [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334] as const /*common*/,
  [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335] as const /*leap*/
] as const;
export const dayOfYear = (d: Date) =>
  YEAR_DAYS_OFFSET[+isLeapYear(d.getUTCFullYear())][d.getUTCMonth()] +
  d.getUTCDate();

/** Returns the ISO day of week. Mon=1,Tue=2,...,Sun=7 */
export const isoWeekday = (date: Date, startOfWeek: DayOfWeek): number => {
  const dow = date.getUTCDay() || 7;
  const name = (startOfWeek as string)
    .toLowerCase()
    .substring(0, 3) as keyof typeof ISO_WEEKDAYS;
  return (dow - ISO_WEEKDAYS[name] + DAYS_PER_WEEK) % DAYS_PER_WEEK;
};

// https://en.wikipedia.org/wiki/ISO_week_date
const p = (y: number): number =>
  (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;

const weeks = (y: number): number => 52 + Number(p(y) == 4 || p(y - 1) == 3);

export function isoWeek(d: Date): number {
  // algorithm based on https://en.wikipedia.org/wiki/ISO_week_date
  const dow = d.getUTCDay() || 7;
  const w = Math.floor((10 + dayOfYear(d) - dow) / 7);
  if (w < 1) return weeks(d.getUTCFullYear() - 1);
  if (w > weeks(d.getUTCFullYear())) return 1;
  return w;
}

export function isoWeekYear(d: Date): number {
  return (
    d.getUTCFullYear() -
    Number(d.getUTCMonth() === 0 && d.getUTCDate() == 1 && d.getUTCDay() < 1)
  );
}

export const MINUTES_PER_HOUR = 60;
export const TIMEUNIT_IN_MILLIS: Readonly<
  Record<Exclude<TimeUnit, "year" | "quarter" | "month">, number>
> = {
  week: 604800000,
  day: 86400000,
  hour: 3600000,
  minute: 60000,
  second: 1000,
  millisecond: 1
};

// default format if unspecified
export const DATE_FORMAT = "%Y-%m-%dT%H:%M:%S.%LZ";

// Inclusive interval of date parts
export const DATE_PART_INTERVAL = [
  ["year", 0, 9999] as const,
  ["month", 1, 12] as const,
  ["day", 1, 31] as const,
  ["hour", 0, 23] as const,
  ["minute", 0, 59] as const,
  ["second", 0, 59] as const,
  ["millisecond", 0, 999] as const
] as const;

export interface DatePartFormatter {
  name: string;
  padding: number;
  re: RegExp;
}
export const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12
};

/** Table of date format specifiers. Defined statically to support tree-shaking. */
export const DATE_SYM_TABLE: Readonly<Record<string, DatePartFormatter>> = {
  "%b": {
    name: "abbr_month",
    padding: 3,
    re: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i
  },
  "%B": {
    name: "full_month",
    padding: 0,
    re: /(January|February|March|April|May|June|July|August|September|October|November|December)/i
  },
  "%Y": { name: "year", padding: 4, re: /([0-9]{4})/ },
  "%G": { name: "year", padding: 4, re: /([0-9]{4})/ },
  "%m": { name: "month", padding: 2, re: /(0[1-9]|1[012])/ },
  "%d": { name: "day", padding: 2, re: /(0[1-9]|[12][0-9]|3[01])/ },
  "%j": {
    name: "day_of_year",
    padding: 3,
    re: /(0[0-9][1-9]|[12][0-9]{2}|3[0-5][0-9]|36[0-6])/
  },
  "%H": { name: "hour", padding: 2, re: /([01][0-9]|2[0-3])/ },
  "%M": { name: "minute", padding: 2, re: /([0-5][0-9])/ },
  "%S": { name: "second", padding: 2, re: /([0-5][0-9]|60)/ },
  "%L": { name: "millisecond", padding: 3, re: /([0-9]{3})/ },
  "%w": { name: "day_of_week", padding: 1, re: /([0-6])/ },
  "%u": { name: "day_of_week_iso", padding: 1, re: /([1-7])/ },
  "%U": { name: "week_of_year", padding: 2, re: /([1-4][0-9]?|5[0-3]?)/ },
  "%V": { name: "week_of_year_iso", padding: 2, re: /([1-4][0-9]?|5[0-3]?)/ },
  "%z": {
    name: "timezone",
    padding: 2,
    re: /(([+-][01][0-9]|2[0-3]):?([0-5][0-9])?)/
  },
  "%Z": { name: "minute_offset", padding: 3, re: /([+-][0-9]{3})/ },
  "%%": { name: "percent_literal", padding: 1, re: /%%/ }
};

/** Regex for capturing format specifiers in groups. Defined statically to support tree-shaking.  */
export const DATE_FORMAT_SYM_RE = /(%[bBYGmdjHMSLwuUVzZ%])/g;
/** Regex for splitting date string by format specifiers. Defined statically for tree-shaking.  */
export const DATE_FORMAT_SEP_RE = /%[bBYGmdjHMSLwuUVzZ%]/;

const TIMEZONE_RE = /^[a-zA-Z_]+\/[a-zA-Z_]+$/;

/**
 * Parse and return the timezone string as a number
 * @param tzstr Timezone string matching '+/-hh[:][mm]' or Olson name.
 */
export function parseTimezone(tzstr?: string): number {
  if (isNil(tzstr)) return 0;

  if (TIMEZONE_RE.test(tzstr)) {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone: tzstr }));
    return (tzDate.getTime() - utcDate.getTime()) / 6e4;
  }

  const m = DATE_SYM_TABLE["%z"].re.exec(tzstr);
  assert(!!m, `timezone '${tzstr}' is invalid or not supported.`);

  const hr = parseInt(m[2]) || 0;
  const min = parseInt(m[3]) || 0;

  return (Math.abs(hr * MINUTES_PER_HOUR) + min) * (hr < 0 ? -1 : 1);
}

/**
 * Formats a timezone offset in minutes into a string representation.
 * The output is in the format of "+HHMM" or "-HHMM", where "HH" represents
 * the hours and "MM" represents the minutes of the offset.
 */
export function formatTimezone(minuteOffset: number): string {
  return (
    (minuteOffset < 0 ? "-" : "+") +
    padDigits(Math.abs(Math.floor(minuteOffset / MINUTES_PER_HOUR)), 2) +
    padDigits(Math.abs(minuteOffset) % MINUTES_PER_HOUR, 2)
  );
}

/**
 * Adjust the date by the given timezone
 * @param d Date object
 * @param minuteOffset number
 */
export function adjustDate(d: Date, minuteOffset: number): void {
  d.setUTCMinutes(d.getUTCMinutes() + minuteOffset);
}

/**
 * Computes a date expression
 * @param obj The target object
 * @param expr Any value that resolves to a valid date expression. Valid expressions include a number, Date, or Object{date: number|Date, timezone?: string}
 */
export function computeDate(obj: Any, expr: Any, options: Options): Date {
  if (isDate(obj)) return obj;

  const d = computeValue(obj, expr, null, options) as
    | Date
    | number
    | { date: Date | number; timezone?: string };

  if (isDate(d)) return new Date(d);
  // timestamp is in seconds
  if (isNumber(d)) return new Date(d * 1000);

  assert(!!d?.date, `cannot convert ${JSON.stringify(expr)} to date`);

  const date = isDate(d.date) ? new Date(d.date) : new Date(d.date * 1000);

  if (d.timezone) {
    adjustDate(date, parseTimezone(d.timezone));
  }

  return date;
}

export function padDigits(n: number, digits: number): string {
  return (
    new Array(Math.max(digits - String(n).length + 1, 0)).join("0") +
    n.toString()
  );
}

/**
 * Determines a number of leap years in a year range (leap year reference point; 'year'].
 *
 * See {@link https://github.com/mongodb/mongo/blob/master/src/mongo/db/query/datetime/date_time_support.cpp#L749}
 */
const leapYearsSinceReferencePoint = (year: number): number => {
  // leapYearsSinceReferencePoint
  // Count a number of leap years that happened since the reference point, where a leap year is
  // when year%4==0, excluding years when year%100==0, except when year%400==0.
  const yearsSinceReferencePoint = year - LEAP_YEAR_REF_POINT;
  return (
    Math.trunc(yearsSinceReferencePoint / 4) -
    Math.trunc(yearsSinceReferencePoint / 100) +
    Math.trunc(yearsSinceReferencePoint / 400)
  );
};

/**
 * Sums the number of days in the Gregorian calendar in years: 'startYear',
 * 'startYear'+1, .., 'endYear'-1. 'startYear' and 'endYear' are expected to be from the range
 * (-1000'000'000; +1000'000'000).
 *
 * See {@link https://github.com/mongodb/mongo/blob/master/src/mongo/db/query/datetime/date_time_support.cpp#L762}
 */
export function daysBetweenYears(startYear: number, endYear: number): number {
  return Math.trunc(
    leapYearsSinceReferencePoint(endYear - 1) -
      leapYearsSinceReferencePoint(startYear - 1) +
      (endYear - startYear) * DAYS_IN_YEAR[0]
  );
}

export const dateDiffYear = (start: Date, end: Date): number =>
  end.getUTCFullYear() - start.getUTCFullYear();

export const dateDiffMonth = (start: Date, end: Date): number =>
  end.getUTCMonth() - start.getUTCMonth() + dateDiffYear(start, end) * 12;

export const dateDiffQuarter = (start: Date, end: Date): number => {
  const a = Math.trunc(start.getUTCMonth() / 3);
  const b = Math.trunc(end.getUTCMonth() / 3);
  return b - a + dateDiffYear(start, end) * 4;
};

export const dateDiffDay = (start: Date, end: Date): number =>
  dayOfYear(end) -
  dayOfYear(start) +
  daysBetweenYears(start.getUTCFullYear(), end.getUTCFullYear());

export const dateDiffWeek = (
  start: Date,
  end: Date,
  startOfWeek?: DayOfWeek
): number => {
  const wk = (startOfWeek || "sun").substring(0, 3) as DayOfWeek;
  return Math.trunc(
    (dateDiffDay(start, end) + isoWeekday(start, wk) - isoWeekday(end, wk)) /
      DAYS_PER_WEEK
  );
};

export const dateDiffHour = (start: Date, end: Date): number =>
  end.getUTCHours() - start.getUTCHours() + dateDiffDay(start, end) * 24;

const addMonth = (d: Date, amount: number): void => {
  // months start from 0 to 11.
  const m = d.getUTCMonth() + amount;
  const yearOffset = Math.floor(m / 12);
  if (m < 0) {
    const month = (m % 12) + 12;
    d.setUTCFullYear(d.getUTCFullYear() + yearOffset, month, d.getUTCDate());
  } else {
    d.setUTCFullYear(d.getUTCFullYear() + yearOffset, m % 12, d.getUTCDate());
  }
};

export const dateAdd = (
  date: Date,
  unit: TimeUnit,
  amount: number,
  _timezone?: string
): Date => {
  const d = new Date(date);
  switch (unit) {
    case "year":
      d.setUTCFullYear(d.getUTCFullYear() + amount);
      break;
    case "quarter":
      addMonth(d, 3 * amount);
      break;
    case "month":
      addMonth(d, amount);
      break;
    default:
      d.setTime(d.getTime() + TIMEUNIT_IN_MILLIS[unit] * amount);
  }

  return d;
};
