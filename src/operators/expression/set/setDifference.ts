/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, Callback, RawArray, RawObject } from "../../../types";
import { notInArray } from "../../../util";

/**
 * Returns elements of a set that do not appear in a second set.
 * @param obj
 * @param expr
 */
export function $setDifference(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as RawArray[];
  return args[0].filter(notInArray.bind(null, args[1]) as Callback);
}
