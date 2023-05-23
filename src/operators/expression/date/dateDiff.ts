// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, Duration, RawObject } from "../../../types";
import { computeDate, DURATION_IN_MILLIS } from "./_internal";

/**
 * Returns the difference between two dates.
 * @param obj
 * @param expr
 * @param options Options
 */
export function $dateDiff(
  obj: RawObject,
  expr: RawObject,
  options: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as {
    startDate: AnyVal;
    endDate: AnyVal;
    unit: Duration;
    timezone?: string;
    startOfWeek?: string;
  };

  const d1 = computeDate(obj, expr.startDate, options);
  const d2 = computeDate(obj, expr.endDate, options);

  let diff;
  switch (args.unit) {
    case "year":
    case "quarter":
    case "month":
      diff = diffYQM(d1, d2, args.unit);
      break;
    default:
      diff = (d2.getTime() - d1.getTime()) / DURATION_IN_MILLIS[args.unit];
  }

  return diff;
}

const unitMonths = {
  year: 12,
  quarter: 3,
  month: 1
};

function diffYQM(d1: Date, d2: Date, unit: string): number {
  let months = (d2.getUTCFullYear() - d1.getUTCFullYear()) * 12;
  months -= d1.getUTCMonth();
  months += d2.getUTCMonth();
  return Math.trunc(months / unitMonths[unit]);
}
