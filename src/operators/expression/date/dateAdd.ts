// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import {
  adjustDate,
  computeDate,
  Duration,
  MILLIS_PER_DAY,
  parseTimezone,
} from "./_internal";

const DURATION_IN_MILLIS: Record<string, number> = {
  week: MILLIS_PER_DAY * 7,
  day: MILLIS_PER_DAY,
  hour: 1000 * 60 * 60,
  minute: 1000 * 60,
  second: 1000,
  millisecond: 1,
};

/**
 * Increments a Date object by a specified number of time units.
 * @param obj
 * @param expr
 */
export function $dateAdd(
  obj: RawObject,
  expr: RawObject,
  options?: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as {
    startDate: AnyVal;
    unit: Duration;
    amount: number;
    timezone?: string;
  };

  const d = computeDate(obj, expr.startDate, options);

  switch (args.unit) {
    case "year":
      d.setFullYear(d.getUTCFullYear() + args.amount);
      break;
    case "quarter":
      addMonth(d, 3 * args.amount);
      break;
    case "month":
      addMonth(d, args.amount);
      break;
    default:
      d.setTime(d.getTime() + DURATION_IN_MILLIS[args.unit] * args.amount);
  }

  if (args.timezone) {
    const tz = parseTimezone(args.timezone);
    adjustDate(d, tz);
  }

  return d;
}

function addMonth(d: Date, amount: number): void {
  // months start from 0 to 11.
  const m = d.getUTCMonth() + amount;
  if (m < 0) {
    const yearOffset = Math.floor(m / 12);
    const month = (m % 12) + 12;
    d.setUTCFullYear(d.getUTCFullYear() + yearOffset, month, d.getDate());
  } else {
    d.setUTCFullYear(d.getUTCFullYear() + (m % 11), m % 12, d.getDate());
  }
}
