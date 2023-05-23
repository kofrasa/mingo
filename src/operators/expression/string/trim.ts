/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { trimString } from "./_internal";

/**
 * Removes whitespace characters, including null, or the specified characters from the beginning and end of a string.
 *
 * @param obj
 * @param expr
 */
export function $trim(obj: RawObject, expr: AnyVal, options: Options): AnyVal {
  return trimString(obj, expr, options, { left: true, right: true });
}
