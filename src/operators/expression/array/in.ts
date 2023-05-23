// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, Callback, RawArray, RawObject } from "../../../types";
import { assert, isArray, isEqual } from "../../../util";

/**
 * Returns a boolean indicating whether a specified value is in an array.
 *
 * @param {Object} obj
 * @param {Array} expr
 */
export function $in(obj: RawObject, expr: AnyVal, options: Options): boolean {
  const [item, arr] = computeValue(obj, expr, null, options) as [
    AnyVal,
    RawArray
  ];
  assert(isArray(arr), "$in second argument must be an array");
  return arr.some(isEqual.bind(null, item) as Callback);
}
