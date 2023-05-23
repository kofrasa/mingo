// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { computeDate } from "./_internal";

/**
 * Returns the year number in ISO 8601 format. The year starts with the Monday of week 1 and ends with the Sunday of the last week.
 * @param obj
 * @param expr
 */
export function $isoWeekYear(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number {
  const d = computeDate(obj, expr, options);
  return (
    d.getUTCFullYear() -
    Number(d.getUTCMonth() == 0 && d.getUTCDate() == 1 && d.getUTCDay() < 1)
  );
}
