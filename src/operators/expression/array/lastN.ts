// https://www.mongodb.com/docs/manual/reference/operator/aggregation/lastN-array-element/#mongodb-expression-exp.-lastN

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { assert, isArray, isNil } from "../../../util";
import { $lastN as __lastN } from "../../accumulator/lastN";

interface InputExpr {
  n: AnyVal;
  input: AnyVal;
}

/**
 * Returns a specified number of elements from the end of an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $lastN(
  obj: RawObject,
  expr: InputExpr,
  options: Options
): AnyVal {
  // first try the accumulator if input is an array.
  if (obj instanceof Array) return __lastN(obj, expr, options);
  const { input, n } = computeValue(obj, expr, null, options) as InputExpr;
  if (isNil(input)) return null;
  assert(isArray(input), "Must resolve to an array/null or missing");
  return __lastN(input as RawObject[], { n, input: "$$this" }, options);
}
