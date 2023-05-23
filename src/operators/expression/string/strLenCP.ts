/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";

/**
 * Returns the number of UTF-8 code points in the specified string.
 *
 * @param  {Object} obj
 * @param  {String} expr
 * @return {Number}
 */
export function $strLenCP(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  return (computeValue(obj, expr, null, options) as RawArray).length;
}
