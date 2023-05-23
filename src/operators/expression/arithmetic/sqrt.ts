// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { assert, isNil, isNumber } from "../../../util";

/**
 * Calculates the square root of a positive number and returns the result as a double.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $sqrt(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number | null {
  const n = computeValue(obj, expr, null, options) as number;
  if (isNil(n)) return null;
  assert(
    (isNumber(n) && n > 0) || isNaN(n),
    "$sqrt expression must resolve to non-negative number."
  );
  return Math.sqrt(n);
}
