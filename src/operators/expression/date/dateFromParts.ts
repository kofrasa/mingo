// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { DATE_PART_INTERVAL, parseTimezone } from "./_internal";

interface DateArgs {
  year: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
  timezone?: string;
}

/**
 * Constructs and returns a Date object given the date’s constituent properties.
 *
 * @param obj The document
 * @param expr The date expression
 * @param options Options
 */
export function $dateFromParts(
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as DateArgs;

  const tz = parseTimezone(args.timezone);

  // assign default and adjust value ranges of the different parts

  for (let i = DATE_PART_INTERVAL.length - 1, remainder = 0; i >= 0; i--) {
    const datePartInterval = DATE_PART_INTERVAL[i];
    const k = datePartInterval[0] as string;
    const min = datePartInterval[1] as number;
    const max = datePartInterval[2] as number;

    // add remainder from previous part. units should already be correct
    let part = ((args[k] as number) || 0) + remainder;

    // 1. compute the remainder for the next part
    // 2. adjust the current part to a valid range
    // 3. assign back to 'args'
    const limit = max + 1;

    // invert timezone to adjust the hours to UTC
    if (k == "hour") part += tz.hour * -1;
    if (k == "minute") part += tz.minute * -1;

    // smaller than lower bound
    if (part < min) {
      const delta = min - part;
      remainder = -1 * Math.ceil(delta / limit);
      part = limit - (delta % limit);
    } else if (part > max) {
      // offset with the 'min' value to adjust non-zero date parts correctly
      part += min;
      remainder = Math.trunc(part / limit);
      part %= limit;
    }

    // reassign
    args[k] = part;
  }

  return new Date(
    Date.UTC(
      args.year,
      args.month - 1,
      args.day,
      args.hour,
      args.minute,
      args.second,
      args.millisecond
    )
  );
}
