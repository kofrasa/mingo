// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

import { computeValue, Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import {
  $eq as __eq,
  $gt as __gt,
  $gte as __gte,
  $lt as __lt,
  $lte as __lte,
  $ne as __ne,
  createExpressionOperator,
} from "../_predicates";

export const $eq = createExpressionOperator(__eq);
export const $gt = createExpressionOperator(__gt);
export const $gte = createExpressionOperator(__gte);
export const $lt = createExpressionOperator(__lt);
export const $lte = createExpressionOperator(__lte);
export const $ne = createExpressionOperator(__ne);

/**
 * Compares two values and returns the result of the comparison as an integer.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $cmp(obj: RawObject, expr: AnyVal, options?: Options): AnyVal {
  const args = computeValue(obj, expr, null, options);
  if (args[0] > args[1]) return 1;
  if (args[0] < args[1]) return -1;
  return 0;
}
