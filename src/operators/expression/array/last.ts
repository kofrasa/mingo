// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { ComputeOptions, computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { assert, isArray, isNil } from "../../../util";
import { $last as __last } from "../../accumulator";

/**
 * Returns the last element in an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $last(obj: RawObject, expr: AnyVal, options: Options): AnyVal {
  const copts = ComputeOptions.init(options);
  if (obj instanceof Array) return __last(obj, expr, copts.update());

  const arr = computeValue(obj, expr, null, options) as RawObject[];
  if (isNil(arr)) return null;
  assert(isArray(arr), "Must resolve to an array/null or missing");
  return __last(arr, "$$this", options);
}
