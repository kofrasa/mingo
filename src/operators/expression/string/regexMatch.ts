/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { regexSearch } from "./_internal";

/**
 * Applies a regular expression (regex) to a string and returns a boolean that indicates if a match is found or not.
 *
 * @param obj
 * @param expr
 */
export function $regexMatch(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  return regexSearch(obj, expr, options, { global: false }).length != 0;
}
