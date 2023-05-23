import { computeValue, Options } from "../../../core";
import { AnyVal } from "../../../types";
import { isDate, isNil, isNumber } from "../../../util";

const COMMON_YEAR_DAYS_OFFSET = [
  0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334
];

const LEAP_YEAR_DAYS_OFFSET = [
  0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335
];

// https://en.wikipedia.org/wiki/ISO_week_date
const p = (y: number): number =>
  (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;

const weeks = (y: number): number => 52 + Number(p(y) == 4 || p(y - 1) == 3);

export const isLeapYear = (year: number): boolean =>
  (year & 3) == 0 && (year % 100 != 0 || year % 400 == 0);

export const getDayOfYear = (d: Date): number =>
  (isLeapYear(d.getUTCFullYear())
    ? LEAP_YEAR_DAYS_OFFSET
    : COMMON_YEAR_DAYS_OFFSET)[d.getUTCMonth()] + d.getUTCDate();

export function isoWeek(d: Date): number {
  // algorithm based on https://en.wikipedia.org/wiki/ISO_week_date
  const w = Math.floor((10 + getDayOfYear(d) - (d.getUTCDay() || 7)) / 7);
  if (w < 1) return weeks(d.getUTCFullYear() - 1);
  if (w > weeks(d.getUTCFullYear())) return 1;
  return w;
}

export function isoWeekYear(d: Date): number {
  return (
    d.getUTCFullYear() -
    Number(d.getUTCMonth() == 0 && d.getUTCDate() == 1 && d.getUTCDay() < 1)
  );
}

export const MINUTES_PER_HOUR = 60;

export const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

export const DURATION_IN_MILLIS: Record<string, number> = {
  week: MILLIS_PER_DAY * 7,
  day: MILLIS_PER_DAY,
  hour: 1000 * 60 * 60,
  minute: 1000 * 60,
  second: 1000,
  millisecond: 1
};

// default format if unspecified
export const DATE_FORMAT = "%Y-%m-%dT%H:%M:%S.%LZ";

// Inclusive interval of date parts
export const DATE_PART_INTERVAL = [
  ["year", 0, 9999],
  ["month", 1, 12],
  ["day", 1, 31],
  ["hour", 0, 23],
  ["minute", 0, 59],
  ["second", 0, 59],
  ["millisecond", 0, 999]
];

export interface DatePartFormatter {
  name: string;
  padding: number;
  re: RegExp;
}

// used for formatting dates in $dateToString operator
export const DATE_SYM_TABLE: Record<string, DatePartFormatter> = {
  "%Y": { name: "year", padding: 4, re: /([0-9]{4})/ },
  "%G": { name: "year", padding: 4, re: /([0-9]{4})/ },
  "%m": { name: "month", padding: 2, re: /(0[1-9]|1[012])/ },
  "%d": { name: "day", padding: 2, re: /(0[1-9]|[12][0-9]|3[01])/ },
  "%H": { name: "hour", padding: 2, re: /([01][0-9]|2[0-3])/ },
  "%M": { name: "minute", padding: 2, re: /([0-5][0-9])/ },
  "%S": { name: "second", padding: 2, re: /([0-5][0-9]|60)/ },
  "%L": { name: "millisecond", padding: 3, re: /([0-9]{3})/ },
  "%u": { name: "weekday", padding: 1, re: /([1-7])/ },
  "%U": { name: "week", padding: 2, re: /([1-4][0-9]?|5[0-3]?)/ },
  "%V": { name: "isoWeek", padding: 2, re: /([1-4][0-9]?|5[0-3]?)/ },
  "%z": {
    name: "timezone",
    padding: 2,
    re: /(([+-][01][0-9]|2[0-3]):?([0-5][0-9])?)/
  },
  "%Z": { name: "minuteOffset", padding: 3, re: /([+-][0-9]{3})/ }
  // "%%": "%",
};

/**
 * Parse and return the timezone string as a number
 * @param tzstr Timezone string matching '+/-hh[:][mm]'
 */
export function parseTimezone(tzstr?: string): number {
  if (isNil(tzstr)) return 0;

  const m = DATE_SYM_TABLE["%z"].re.exec(tzstr);
  if (!m)
    throw Error(`invalid or location-based timezone '${tzstr}' not supported`);

  const hr = parseInt(m[2]) || 0;
  const min = parseInt(m[3]) || 0;

  return (Math.abs(hr * MINUTES_PER_HOUR) + min) * (hr < 0 ? -1 : 1);
}

/**
 * Formats the timezone for output
 * @param tz A timezone object
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
export function computeDate(obj: AnyVal, expr: AnyVal, options: Options): Date {
  const d = computeValue(obj, expr, null, options) as
    | Date
    | number
    | { date: Date | number; timezone?: string };

  if (isDate(d)) return new Date(d);
  // timestamp is in seconds
  if (isNumber(d)) return new Date(d * 1000);

  if (d.date) {
    const date = isDate(d.date) ? new Date(d.date) : new Date(d.date * 1000);

    if (d.timezone) {
      adjustDate(date, parseTimezone(d.timezone));
    }

    return date;
  }

  throw Error(`cannot convert ${expr?.toString()} to date`);
}

export function padDigits(n: number, digits: number): string {
  return (
    new Array(Math.max(digits - String(n).length + 1, 0)).join("0") +
    n.toString()
  );
}

export function regexQuote(s: string): string {
  "^.-*?$".split("").forEach((c: string) => {
    s = s.replace(c, `\\${c}`);
  });
  return s;
}

export function regexStrip(s: string): string {
  return s.replace(/^\//, "").replace(/\/$/, "");
}
