// Literal Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#literal-expression-operator

/**
 * Return a value without parsing.
 * @param obj
 * @param expr
 */
export function $literal(obj: object, expr: any): any {
  return expr
}
