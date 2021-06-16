// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { adjustDate, parseTimezone } from "./_internal";

/**
 * Returns a document that contains the constituent parts of a given Date value as individual properties.
 * The properties returned are year, month, day, hour, minute, second and millisecond.
 *
 * @param obj
 * @param expr
 * @param options
 */
export function $dateToParts(
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as {
    date: Date;
    timezone?: string;
    iso8601?: boolean;
  };

  if (args.iso8601 === true)
    throw new Error("$dateToParts: argument 'iso8601' is not supported");

  const d = new Date(args.date);
  const tz = parseTimezone(args.timezone);
  // invert timezone to construct value in UTC
  tz.hour *= -1;
  tz.minute *= -1;

  adjustDate(d, tz);

  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    millisecond: d.getUTCMilliseconds(),
  };
}
