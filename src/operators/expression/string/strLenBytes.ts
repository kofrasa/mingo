/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";

/**
 * Returns the number of UTF-8 encoded bytes in the specified string.
 *
 * @param  {Object} obj
 * @param  {String} expr
 * @return {Number}
 */
export const $strLenBytes: ExpressionOperator = (
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal => {
  return ~-encodeURI(computeValue(obj, expr, null, options) as string).split(
    /%..|./
  ).length;
};
