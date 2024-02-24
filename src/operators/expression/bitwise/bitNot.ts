// Bitwise Operators: https://www.mongodb.com/docs/manual/reference/operator/aggregation/bitNot/#mongodb-expression-exp

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { AnyVal, MingoError, RawObject } from "../../../types";
import { isNil, isNumber } from "../../../util";

/**
 * Returns the result of a bitwise not operation on a single argument or an array that contains a single int or long value.
 *
 * @param obj RawObject from collection
 * @param expr Right hand side expression of operator
 * @returns {Number}
 */
export const $bitNot: ExpressionOperator = (
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal => {
  const n = computeValue(obj, expr, null, options) as number;
  if (isNil(n)) return null;
  if (isNumber(n)) return ~n;
  throw new MingoError("$bitNot: expression must evaluate to a number.");
};
