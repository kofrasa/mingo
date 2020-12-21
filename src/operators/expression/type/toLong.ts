/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { Options } from "../../../core";
import { AnyVal, MAX_LONG, MIN_LONG, RawObject } from "../../../util";
import { toInteger } from "./_internal";

/**
 * Converts a value to a long. If the value cannot be converted to a long, $toLong errors. If the value is null or missing, $toLong returns null.
 * @param obj
 * @param expr
 */
export function $toLong(
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): number | null {
  return toInteger(obj, expr, options, MAX_LONG, MIN_LONG, "long");
}
