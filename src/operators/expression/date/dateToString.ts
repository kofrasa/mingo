import { evalExpr } from "../../../core/_internal";
import { Any, AnyObject, Callback, Options } from "../../../types";
import { assert, isNil } from "../../../util";
import {
  adjustDate,
  computeDate,
  DATE_FORMAT,
  DATE_FORMAT_SYM_RE,
  DATE_SYM_TABLE,
  DatePartFormatter,
  dayOfYear,
  formatTimezone,
  isoWeek,
  isoWeekYear,
  padDigits,
  parseTimezone,
  weekOfYear
} from "./_internal";

interface DateOptions {
  date?: Date;
  format?: string;
  timezone?: string;
  onNull?: string | null;
}

// date functions for format specifiers
const DATE_FUNCTIONS: Record<string, Callback<number, Date>> = {
  "%Y": (d: Date) => d.getUTCFullYear(), //year
  "%G": isoWeekYear, //year
  "%m": (d: Date) => d.getUTCMonth() + 1, //month
  "%d": (d: Date) => d.getUTCDate(), //dayOfMonth
  "%H": (d: Date) => d.getUTCHours(), //hour
  "%M": (d: Date) => d.getUTCMinutes(), //minutes
  "%S": (d: Date) => d.getUTCSeconds(), //seconds
  "%L": (d: Date) => d.getUTCMilliseconds(), //milliseconds
  "%u": (d: Date) => d.getUTCDay() || 7, //isoDayOfWeek
  "%U": weekOfYear,
  "%V": isoWeek,
  "%j": dayOfYear,
  "%w": (d: Date) => d.getUTCDay() //dayOfWeek
};

/**
 * Returns the date as a formatted string.
 *
 * %d	Day of Month (2 digits, zero padded)	01-31
 * %G	Year in ISO 8601 format	0000-9999
 * %H	Hour (2 digits, zero padded, 24-hour clock)	00-23
 * %j Day of year (3 digits, zero padded) 001-366
 * %L	Millisecond (3 digits, zero padded)	000-999
 * %m	Month (2 digits, zero padded)	01-12
 * %M	Minute (2 digits, zero padded)	00-59
 * %S	Second (2 digits, zero padded)	00-60
 * %u	Day of week number in ISO 8601 format (1-Monday, 7-Sunday)	1-7
 * %V	Week of Year in ISO 8601 format	1-53
 * %w Day of week as an integer (0-Sunday, 6-Saturday) 0-6
 * %Y	Year (4 digits, zero padded)	0000-9999
 * %z	The timezone offset from UTC.	+/-[hh][mm]
 * %Z	The minutes offset from UTC as a number. For example, if the timezone offset (+/-[hhmm]) was +0445, the minutes offset is +285.	+/-mmm
 * %%	Percent Character as a Literal	%
 */
export const $dateToString = (obj: AnyObject, expr: Any, options: Options) => {
  const args = evalExpr(obj, expr, options) as DateOptions;

  if (isNil(args.onNull)) args.onNull = null;
  if (isNil(args.date)) return args.onNull;

  const date = computeDate(obj, args.date, options);
  let format = args.format ?? DATE_FORMAT;
  const minuteOffset = parseTimezone(args.timezone, date);
  const matches = format.match(DATE_FORMAT_SYM_RE);

  if (!matches) return format;

  // adjust the date to reflect timezone
  adjustDate(date, minuteOffset);

  for (let i = 0, len = matches.length; i < len; i++) {
    const formatSpec = matches[i];
    assert(
      formatSpec in DATE_SYM_TABLE,
      `$dateToString: invalid format specifier ${formatSpec}`
    );
    const { name, padding } = DATE_SYM_TABLE[formatSpec];
    const fn = DATE_FUNCTIONS[formatSpec] as Callback<number, Date>;
    let value: string | DatePartFormatter = "";

    if (fn) {
      value = padDigits(fn(date), padding);
    } else {
      switch (name) {
        case "timezone":
          value = formatTimezone(minuteOffset);
          break;
        case "minute_offset":
          value = minuteOffset.toString();
          break;
        case "abbr_month":
        case "full_month": {
          const format = name.startsWith("abbr") ? "short" : "long";
          value = date.toLocaleString("en-US", { month: format });
          break;
        }
      }
    }
    // replace the match with resolved value
    format = format.replace(formatSpec, value);
  }

  return format;
};
