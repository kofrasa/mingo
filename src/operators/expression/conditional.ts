/**
 * Conditional Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators
 */

import { assert, isArray, isNil, isObject } from '../../util'
import { computeValue } from '../../internal'

/**
 * A ternary operator that evaluates one expression,
 * and depending on the result returns the value of one following expressions.
 *
 * @param obj
 * @param expr
 */
export function $cond(obj: object, expr: any): any {
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
  let condition = computeValue(obj, ifExpr)
  return computeValue(obj, condition ? thenExpr : elseExpr)
}

/**
 * An operator that evaluates a series of case expressions. When it finds an expression which
 * evaluates to true, it returns the resulting expression for that case. If none of the cases
 * evaluate to true, it returns the default expression.
 *
 * @param obj
 * @param expr
 */
export function $switch(obj: object, expr: any): any {
  let validBranch = expr.branches.find((branch: { case: any, then: any }) => {
    return computeValue(obj, branch.case)
  })

  return computeValue(obj, !!validBranch ? validBranch.then : expr.default)
}

/**
 * Evaluates an expression and returns the first expression if it evaluates to a non-null value.
 * Otherwise, $ifNull returns the second expression's value.
 *
 * @param obj
 * @param expr
 * @returns {*}
 */
export function $ifNull(obj: object, expr: any): any {
  assert(isArray(expr) && expr.length === 2, '$ifNull expression must resolve to array(2)')
  let args = computeValue(obj, expr)
  return isNil(args[0]) ? args[1] : args[0]
}
