// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";

/**
 * Takes an array that contains two numbers or two dates and subtracts the second value from the first.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $subtract(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number {
  const args = computeValue(obj, expr, null, options) as number[];
  return args[0] - args[1];
}
