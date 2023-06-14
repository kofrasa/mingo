/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { AnyVal, Callback, RawArray, RawObject } from "../../../types";
import { inArray } from "../../../util";

/**
 * Concatenates two strings.
 *
 * @param obj
 * @param expr
 * @returns {string|*}
 */
export const $concat: ExpressionOperator = (
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal => {
  const args = computeValue(obj, expr, null, options) as RawArray;
  // does not allow concatenation with nulls
  if (
    ([null, undefined] as RawArray).some(inArray.bind(null, args) as Callback)
  )
    return null;
  return args.join("");
};
