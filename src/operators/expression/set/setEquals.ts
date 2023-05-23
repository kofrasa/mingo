/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { intersection, unique } from "../../../util";

/**
 * Returns true if two sets have the same elements.
 * @param obj
 * @param expr
 */
export function $setEquals(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as RawArray[];
  const xs = unique(args[0], options?.hashFunction);
  const ys = unique(args[1], options?.hashFunction);
  return (
    xs.length === ys.length &&
    xs.length === intersection([xs, ys], options?.hashFunction).length
  );
}
