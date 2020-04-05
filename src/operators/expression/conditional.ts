/**
 * Conditional Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators
 */

import { assert, isArray, isNil, isObject } from '../../util'
import { computeValue, Options } from '../../core'

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
    if (found) thenExpr = b.then
    return found
  })

  return computeValue(obj, !!thenExpr ? thenExpr : expr.default, null, options)
}

/**
 * Evaluates an expression and returns the first expression if it evaluates to a non-null value.
 * Otherwise, $ifNull returns the second expression's value.
 *
 * @param obj
 * @param expr
 * @returns {*}
 */
export function $ifNull(obj: object, expr: any, options: Options): any {
  assert(isArray(expr) && expr.length === 2, '$ifNull expression must resolve to array(2)')
  let args = computeValue(obj, expr, null, options)
  return isNil(args[0]) ? args[1] : args[0]
}
