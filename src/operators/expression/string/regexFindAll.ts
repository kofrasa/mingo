/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { regexSearch } from "./_internal";

/**
 * Applies a regular expression (regex) to a string and returns information on the all matched substrings.
 *
 * @param obj
 * @param expr
 */
export function $regexFindAll(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  return regexSearch(obj, expr, options, { global: true });
}
