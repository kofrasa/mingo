/**
 * Conditional Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators
 */

import { assert, isArray, isObject } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * A ternary operator that evaluates one expression,
 * and depending on the result returns the value of one following expressions.
 *
 * @param obj
 * @param expr
 */
export function $cond(obj: object, expr: any, options: Options): any {
  let ifExpr: any
  let thenExpr: any
  let elseExpr: any
  const errorMsg = '$cond: invalid arguments'
  if (isArray(expr)) {
    assert(expr.length === 3, errorMsg)
    ifExpr = expr[0]
    thenExpr = expr[1]
    elseExpr = expr[2]
  } else {
    assert(isObject(expr), errorMsg)
    ifExpr = expr.if
    thenExpr = expr.then
    elseExpr = expr.else
  }
  let condition = computeValue(obj, ifExpr, null , options)
  return computeValue(obj, condition ? thenExpr : elseExpr, null, options)
}
