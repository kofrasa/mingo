// Literal Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#literal-expression-operator

import { Options } from "../../core"

/**
 * Return a value without parsing.
 * @param obj
 * @param expr
 * @param options
 */
export function $literal(obj: object, expr: any, options: Options): any {
  return expr
}
