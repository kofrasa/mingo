// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";

/**
 * Computes the product of an array of numbers.
 *
 * @param obj
 * @param expr
 * @returns {Object}
 */
export function $multiply(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number {
  const args = computeValue(obj, expr, null, options) as number[];
  return args.reduce((acc, num) => acc * num, 1);
}
