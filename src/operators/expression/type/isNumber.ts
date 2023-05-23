/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { isNumber } from "../../../util";

/**
 * Checks if the specified expression resolves to a numeric value
 *
 * @param obj
 * @param expr
 */
export function $isNumber(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): boolean | null {
  const n = computeValue(obj, expr, null, options);
  return isNumber(n);
}
