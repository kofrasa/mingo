/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { truthy } from "../../../util";

/**
 * Returns true if all elements of a set evaluate to true, and false otherwise.
 * @param obj
 * @param expr
 */
export function $allElementsTrue(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  // mongodb nests the array expression in another
  const args = computeValue(obj, expr, null, options)[0] as RawArray;
  return args.every(v => truthy(v, options.useStrictMode));
}
