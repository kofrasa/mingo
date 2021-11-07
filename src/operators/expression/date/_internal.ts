import { isNumber } from "lodash";

import { computeValue, Options } from "../../../core";
import { AnyVal } from "../../../types";
import { isDate, isNil } from "../../../util";

export type Duration =
  | "year"
  | "quarter"
  | "month"
  | "week"
  | "day"
  | "hour"
  | "minute"
  | "second"
  | "millisecond";

export const MINUTES_PER_HOUR = 60;

export const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

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
  ["millisecond", 0, 999],
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
  "%u": { name: "weekDay", padding: 1, re: /([1-7])/ },
  "%V": { name: "week", padding: 1, re: /([1-4][0-9]?|5[0-3]?)/ },
  "%z": {
    name: "timezone",
    padding: 2,
    re: /(([+-][01][0-9]|2[0-3]):?([0-5][0-9])?)/,
  },
  "%Z": { name: "minuteOffset", padding: 3, re: /([+-][0-9]{3})/ },
  // "%%": "%",
};

export interface Timezone {
  hour: number;
  minute: number;
}

/**
 * Parse and return the timezone string as a number
 * @param tzstr Timezone string matching '+/-hh[:][mm]'
 */
export function parseTimezone(tzstr?: string): Timezone {
  if (isNil(tzstr)) return { hour: 0, minute: 0 };

  const m = DATE_SYM_TABLE["%z"].re.exec(tzstr);
  if (!m)
    throw Error(`invalid or location-based timezone '${tzstr}' not supported`);

  return {
    hour: parseInt(m[2]) || 0,
    minute: parseInt(m[3]) || 0,
  };
}

/**
 * Formats the timezone for output
 * @param tz A timezone object
 */
export function formatTimezone(tz: Timezone): string {
  return (
    (tz.hour < 0 ? "-" : "+") +
    padDigits(Math.abs(tz.hour), 2) +
    padDigits(tz.minute, 2)
  );
}

/**
 * Adjust the date by the given timezone
 * @param d Date object
 * @param tz Timezone
 */
export function adjustDate(d: Date, tz: Timezone): void {
  const sign = tz.hour < 0 ? -1 : 1;
  d.setUTCHours(d.getUTCHours() + tz.hour);
  d.setUTCMinutes(d.getUTCMinutes() + sign * tz.minute);
}

/**
 * Computes a date expression
 * @param obj The target object
 * @param expr Any value that resolves to a valid date expression. Valid expressions include a number, Date, or Object{date: number|Date, timezone?: string}
 */
export function computeDate(
  obj: AnyVal,
  expr: AnyVal,
  options?: Options
): Date {
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
