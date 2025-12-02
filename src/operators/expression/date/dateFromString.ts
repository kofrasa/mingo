import { computeValue } from "../../../core/_internal";
import { Any, AnyObject, ExpressionOperator, Options } from "../../../types";
import { assert, isNil, isObject } from "../../../util";
import {
  adjustDate,
  DATE_FORMAT,
  DATE_FORMAT_SEP_RE,
  DATE_FORMAT_SYM_RE,
  DATE_SYM_TABLE,
  MINUTES_PER_HOUR,
  MONTHS,
  parseTimezone
} from "./_internal";

function tzLetterOffset(c: string): number {
  if (c === "Z") return 0;
  if (c >= "A" && c < "N") return c.charCodeAt(0) - 64; // [A, M] => [1, 12]
  return 77 - c.charCodeAt(0); // [N, Y] => [-1, -12]
}

const regexStrip = (s: string): string =>
  s.replace(/^\//, "").replace(/\/$/, "").replace(/\/i/, "");

const REGEX_SPECIAL_CHARS = ["^", ".", "-", "*", "?", "$"] as const;
function regexQuote(s: string): string {
  REGEX_SPECIAL_CHARS.forEach((c: string) => {
    s = s.replace(c, `\\${c}`);
  });
  return s;
}

interface InputExpr {
  dateString?: string;
  timezone?: string;
  format?: string;
  onError?: Any;
  onNull?: Any;
}

/**
 * Converts a date/time string to a date object.
 * @param obj
 * @param expr
 */
export const $dateFromString: ExpressionOperator<Any> = (
  obj: AnyObject,
  expr: InputExpr,
  options: Options
): Any => {
  const args = computeValue(obj, expr, null, options) as InputExpr;

  args.format = args.format || DATE_FORMAT;
  args.onNull = args.onNull || null;

  let dateString = args.dateString;
  if (isNil(dateString)) return args.onNull;

  // collect all separators of the format string
  const separators = args.format.split(DATE_FORMAT_SEP_RE);
  separators.reverse();

  const matches = args.format.match(DATE_FORMAT_SYM_RE);

  const dateParts: {
    year?: number;
    month?: number;
    full_month?: string;
    abbr_month?: string;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
    timezone?: string;
    minute_offset?: string;
  } = {};

  // holds the valid regex of parts that matches input date string
  let expectedPattern = "";

  for (let i = 0, len = matches.length; i < len; i++) {
    const formatSpecifier = matches[i];
    const props = DATE_SYM_TABLE[formatSpecifier];

    if (isObject(props)) {
      // get pattern and alias from table
      const m = props.re.exec(dateString);

      // get the next separtor
      const delimiter = separators.pop() || "";

      if (m !== null) {
        // store and cut out matched part
        dateParts[props.name] = /^\d+$/.exec(m[0]) ? parseInt(m[0]) : m[0];
        dateString = dateString.substring(m.index + m[0].length + 1);

        // construct expected pattern
        expectedPattern +=
          regexQuote(delimiter) + regexStrip(props.re.toString());
      } else {
        dateParts[props.name] = null;
      }
    }
  }
  // Transform month names to month number
  if (isNil(dateParts.month)) {
    const abbrMonth = (
      dateParts.full_month?.slice(0, 3) ??
      dateParts.abbr_month ??
      ""
    ).toLowerCase();
    if (MONTHS[abbrMonth]) {
      dateParts.month = MONTHS[abbrMonth];
    }
  }

  // 1. validate all required date parts exists
  // 2. validate original dateString against expected pattern.
  if (
    isNil(dateParts.year) ||
    isNil(dateParts.month) ||
    isNil(dateParts.day) ||
    !new RegExp("^" + expectedPattern + "[A-Z]?$").exec(args.dateString)
  ) {
    return args.onError;
  }

  const m = args.dateString.match(/([A-Z])$/);
  assert(
    // only one of in-date timeone or timezone argument but not both.
    !(m && args.timezone),
    `$dateFromString: you cannot pass in a date/time string with time zone information ('${
      m && m[0]
    }') together with a timezone argument`
  );

  const minuteOffset = m
    ? tzLetterOffset(m[0]) * MINUTES_PER_HOUR
    : parseTimezone(args.timezone);

  // create the date. month is 0-based in Date
  const d = new Date(
    Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, 0, 0, 0)
  );

  if (!isNil(dateParts.hour)) d.setUTCHours(dateParts.hour);
  if (!isNil(dateParts.minute)) d.setUTCMinutes(dateParts.minute);
  if (!isNil(dateParts.second)) d.setUTCSeconds(dateParts.second);
  if (!isNil(dateParts.millisecond))
    d.setUTCMilliseconds(dateParts.millisecond);

  // adjust to the correct represention for UTC
  adjustDate(d, -minuteOffset);

  return d;
};
