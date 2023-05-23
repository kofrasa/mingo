// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { isNil } from "../../../util";

/**
 * Returns the absolute value of a number.
 *
 * @param obj
 * @param expr
 * @return {Number|null|NaN}
 */
export function $abs(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number | null {
  const n = computeValue(obj, expr, null, options) as number;
  return isNil(n) ? null : Math.abs(n);
}
