// Literal Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#literal-expression-operator

import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";

/**
 * Return a value without parsing.
 * @param obj
 * @param expr
 * @param options
 */
export function $literal(
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal {
  return expr;
}
