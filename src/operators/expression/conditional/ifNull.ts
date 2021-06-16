/**
 * Conditional Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { assert, isArray, isNil } from "../../../util";

/**
 * Evaluates an expression and returns the first expression if it evaluates to a non-null value.
 * Otherwise, $ifNull returns the second expression's value.
 *
 * @param obj
 * @param expr
 * @returns {*}
 */
export function $ifNull(
  obj: RawObject,
  expr: RawArray,
  options?: Options
): AnyVal {
  assert(
    isArray(expr) && expr.length === 2,
    "$ifNull expression must resolve to array(2)"
  );
  const args = computeValue(obj, expr, null, options);
  return isNil(args[0]) ? args[1] : args[0];
}
