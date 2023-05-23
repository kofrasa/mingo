// https://www.mongodb.com/docs/manual/reference/operator/aggregation/maxN-array-element/

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { assert, isArray, isNil } from "../../../util";
import { $maxN as __maxN } from "../../accumulator/maxN";

interface InputExpr {
  n: AnyVal;
  input: AnyVal;
}

/**
 * Returns the n largest values in an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $maxN(
  obj: RawObject,
  expr: InputExpr,
  options: Options
): AnyVal {
  // first try the accumulator if input is an array.
  if (obj instanceof Array) return __maxN(obj, expr, options);
  const { input, n } = computeValue(obj, expr, null, options) as InputExpr;
  if (isNil(input)) return null;
  assert(isArray(input), "Must resolve to an array/null or missing");
  return __maxN(input as RawObject[], { n, input: "$$this" }, options);
}
