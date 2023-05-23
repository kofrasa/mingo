// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { assert, into, isArray, isNil } from "../../../util";

/**
 * Concatenates arrays to return the concatenated array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $concatArrays(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  const arr = computeValue(obj, expr, null, options) as AnyVal[];
  assert(isArray(arr), "$concatArrays must resolve to an array");

  if (arr.some(isNil)) return null;
  return arr.reduce((acc: RawArray, item: RawArray) => into(acc, item), []);
}
