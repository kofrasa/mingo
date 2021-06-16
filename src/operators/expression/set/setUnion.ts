/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { union } from "../../../util";

/**
 * Returns a set that holds all elements of the input sets.
 * @param obj
 * @param expr
 */
export function $setUnion(
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options);
  return union(args[0], args[1]);
}
