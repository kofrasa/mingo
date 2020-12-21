/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, intersection, RawArray, RawObject } from "../../../util";

/**
 * Returns true if all elements of a set appear in a second set.
 * @param obj
 * @param expr
 */
export function $setIsSubset(
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as Array<RawArray>;
  return (
    intersection(args[0], args[1], options?.hashFunction).length ===
    args[0].length
  );
}
