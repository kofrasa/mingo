// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { computeDate } from "./_internal";

/**
 * Returns the milliseconds of a date as a number between 0 and 999.
 * @param obj
 * @param expr
 */
export function $millisecond(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number {
  return computeDate(obj, expr, options).getUTCMilliseconds();
}
