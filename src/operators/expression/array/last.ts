// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { assert, isArray } from "../../../util";

/**
 * Returns the last element in an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $last(obj: RawObject, expr: AnyVal, options?: Options): AnyVal {
  const arr = computeValue(obj, expr, null, options) as AnyVal[];
  if (arr == null) return null;
  assert(isArray(arr), "Must resolve to an array/null or missing");
  if (arr.length > 0) return arr[arr.length - 1];
  return undefined;
}
