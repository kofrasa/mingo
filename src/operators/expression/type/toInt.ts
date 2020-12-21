/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { Options } from "../../../core";
import { AnyVal, MAX_INT, MIN_INT, RawObject } from "../../../util";
import { toInteger } from "./_internal";

/**
 * Converts a value to an integer. If the value cannot be converted to an integer, $toInt errors. If the value is null or missing, $toInt returns null.
 * @param obj
 * @param expr
 */
export function $toInt(
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): number | null {
  return toInteger(obj, expr, options, MAX_INT, MIN_INT, "int");
}
