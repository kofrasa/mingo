// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";

/**
 * Determines if the operand is an array. Returns a boolean.
 *
 * @param  {Object}  obj
 * @param  {*}  expr
 * @return {Boolean}
 */
export function $isArray(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  return computeValue(obj, expr[0], null, options) instanceof Array;
}
