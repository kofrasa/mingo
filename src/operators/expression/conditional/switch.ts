/**
 * Conditional Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators
 */

import { computeValue, Options } from '../../../core'


/**
 * An operator that evaluates a series of case expressions. When it finds an expression which
 * evaluates to true, it returns the resulting expression for that case. If none of the cases
 * evaluate to true, it returns the default expression.
 *
 * @param obj
 * @param expr
 */
export function $switch(obj: object, expr: any, options: Options): any {
  let thenExpr = null

  // Array.prototype.find not supported in IE, hence the '.some()' proxy
  expr.branches.some((b: { case: any, then: any }) => {
    let found = computeValue(obj, b.case, null, options)
    if (found === true) thenExpr = b.then
    return found
  })

  return computeValue(obj, thenExpr !== null ? thenExpr : expr.default, null, options)
}
