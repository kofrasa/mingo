/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { assert, intersection, isArray } from "../../../util";

/**
 * Returns the common elements of the input sets.
 * @param obj
 * @param expr
 */
export function $setIntersection(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as RawArray[];
  assert(
    isArray(args) && args.every(isArray),
    "$setIntersection: expresssion must resolve to array of arrays"
  );
  return intersection(args, options?.hashFunction);
}
