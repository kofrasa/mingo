// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { computeDate, MILLIS_PER_DAY } from "./_internal";

/**
 * Returns the day of the year for a date as a number between 1 and 366 (leap year).
 * @param obj
 * @param expr
 */
export function $dayOfYear(
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): number {
  const d = computeDate(obj, expr, options);
  const start = new Date(d.getUTCFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.round(diff / MILLIS_PER_DAY);
}
