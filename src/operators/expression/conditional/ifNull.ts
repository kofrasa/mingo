/**
 * Conditional Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators
 */

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { isNil } from "../../../util";

/**
 * Evaluates an expression and returns the first non-null value.
 *
 * @param obj
 * @param expr
 * @returns {*}
 */
export const $ifNull: ExpressionOperator = (
  obj: RawObject,
  expr: RawArray,
  options: Options
): AnyVal => {
  const args = computeValue(obj, expr, null, options) as RawArray[];
  return args.find(arg => !isNil(arg));
};
