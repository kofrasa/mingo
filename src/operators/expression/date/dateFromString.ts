// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { isNil, isObject } from "../../../util";
import {
  adjustDate,
  DATE_FORMAT,
  DATE_SYM_TABLE,
  parseTimezone,
  regexQuote,
  regexStrip,
} from "./_internal";

/**
 * Converts a date/time string to a date object.
 * @param obj
 * @param expr
 */
export function $dateFromString(
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): AnyVal {
  const args: {
    dateString?: string;
    timezone?: string;
    format?: string;
    onError?: AnyVal;
    onNull?: AnyVal;
  } = computeValue(obj, expr, null, options);

  args.format = args.format || DATE_FORMAT;
  args.onNull = args.onNull || null;

  let dateString = args.dateString;
  if (isNil(dateString)) return args.onNull;

  // collect all separators of the format string
  const separators = args.format.split(/%[YGmdHMSLuVzZ]/);
  separators.reverse();

  const matches = args.format.match(
    /(%%|%Y|%G|%m|%d|%H|%M|%S|%L|%u|%V|%z|%Z)/g
  );

  const dateParts: {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
    timezone?: string;
    minuteOffset?: string;
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
        dateString =
          dateString.substr(0, m.index) +
          dateString.substr(m.index + m[0].length);

        // construct expected pattern
        expectedPattern +=
          regexQuote(delimiter) + regexStrip(props.re.toString());
      } else {
        dateParts[props.name] = null;
      }
    }
  }

  // 1. validate all required date parts exists
  // 2. validate original dateString against expected pattern.
  if (
    isNil(dateParts.year) ||
    isNil(dateParts.month) ||
    isNil(dateParts.day) ||
    !new RegExp("^" + expectedPattern + "$").exec(args.dateString)
  )
    return args.onError;

  const tz = parseTimezone(args.timezone);

  // create the date. month is 0-based in Date
  const d = new Date(
    Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, 0, 0, 0)
  );

  if (!isNil(dateParts.hour)) d.setUTCHours(dateParts.hour);
  if (!isNil(dateParts.minute)) d.setUTCMinutes(dateParts.minute);
  if (!isNil(dateParts.second)) d.setUTCSeconds(dateParts.second);
  if (!isNil(dateParts.millisecond))
    d.setUTCMilliseconds(dateParts.millisecond);

  // The minute part is unused when converting string.
  // This was observed in the tests on MongoDB site but not officially stated anywhere
  tz.minute = 0;
  adjustDate(d, tz);

  return d;
}
