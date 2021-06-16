/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { inArray } from "../../../util";

/**
 * Concatenates two strings.
 *
 * @param obj
 * @param expr
 * @returns {string|*}
 */
export function $concat(
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as RawArray;
  // does not allow concatenation with nulls
  if ([null, undefined].some(inArray.bind(null, args))) return null;
  return args.join("");
}
