// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from "../../../core";
import {
  AnyVal,
  assert,
  into,
  isArray,
  isNil,
  RawArray,
  RawObject,
} from "../../../util";

/**
 * Returns an array with the elements in reverse order.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $reverseArray(
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): AnyVal {
  const arr = computeValue(obj, expr, null, options) as RawArray;

  if (isNil(arr)) return null;
  assert(isArray(arr), "$reverseArray expression must resolve to an array");

  const result: RawArray = [];
  into(result, arr);
  result.reverse();

  return result;
}
