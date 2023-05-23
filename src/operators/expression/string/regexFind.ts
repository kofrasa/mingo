/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { regexSearch } from "./_internal";

/**
 * Applies a regular expression (regex) to a string and returns information on the first matched substring.
 *
 * @param obj
 * @param expr
 */
export function $regexFind(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  const result = regexSearch(obj, expr, options, { global: false });
  return result && result.length > 0 ? result[0] : null;
}
