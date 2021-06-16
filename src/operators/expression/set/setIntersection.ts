/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { intersection } from "../../../util";

/**
 * Returns the common elements of the input sets.
 * @param obj
 * @param expr
 */
export function $setIntersection(
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options);
  return intersection(args[0], args[1], options?.hashFunction);
}
