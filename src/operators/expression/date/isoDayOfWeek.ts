// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { computeDate } from "./_internal";

/**
 * Returns the weekday number in ISO 8601 format, ranging from 1 (Monday) to 7 (Sunday).
 * @param obj
 * @param expr
 */
export function $isoDayOfWeek(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number {
  return computeDate(obj, expr, options).getUTCDay() || 7;
}
