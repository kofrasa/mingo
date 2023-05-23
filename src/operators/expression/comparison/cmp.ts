// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";

/**
 * Compares two values and returns the result of the comparison as an integer.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $cmp(obj: RawObject, expr: AnyVal, options: Options): AnyVal {
  const args = computeValue(obj, expr, null, options);
  if (args[0] > args[1]) return 1;
  if (args[0] < args[1]) return -1;
  return 0;
}
