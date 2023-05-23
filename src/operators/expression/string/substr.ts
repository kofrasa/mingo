/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { isString } from "../../../util";

/**
 * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
 * The index is zero-based.
 *
 * @param obj
 * @param expr
 * @returns {string}
 */
export function $substr(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  const args = computeValue(obj, expr, null, options) as RawArray;
  const s = args[0] as string;
  const index = args[1] as number;
  const count = args[2] as number;
  if (isString(s)) {
    if (index < 0) {
      return "";
    } else if (count < 0) {
      return s.substr(index);
    } else {
      return s.substr(index, count);
    }
  }
  return "";
}
