/**
 * Conditional operators
 */

import { assert, err, isArray, isNil, isObject } from '../../util.js'
import { computeValue, resolve } from '../../internal.js'

export const conditionalOperators = {

  /**
   * A ternary operator that evaluates one expression,
   * and depending on the result returns the value of one following expressions.
   *
   * @param obj
   * @param expr
   */
  $cond (obj, expr) {
    let ifExpr, thenExpr, elseExpr
    let errorMsg = '$cond: invalid arguments'
    if (isArray(expr)) {
      assert(expr.length === 3, errorMsg)
      ifExpr = expr[0]
      thenExpr = expr[1]
      elseExpr = expr[2]
    } else {
      assert(isObject(expr), errorMsg)
      ifExpr = expr['if']
      thenExpr = expr['then']
      elseExpr = expr['else']
    }
    let condition = computeValue(obj, ifExpr)
    return condition ? computeValue(obj, thenExpr) : computeValue(obj, elseExpr)
  },

  /**
   * An operator that evaluates a series of case expressions. When it finds an expression which
   * evaluates to true, it returns the resulting expression for that case. If none of the cases
   * evaluate to true, it returns the default expression.
   *
   * @param obj
   * @param expr
   */
  $switch (obj, expr) {
    let errorMsg = 'Invalid arguments for $switch operator'
    assert(expr.branches, errorMsg)

    let validBranch = expr.branches.find((branch) => {
      assert(branch['case'] && branch['then'], errorMsg)
      return computeValue(obj, branch['case'])
    })

    if (validBranch) {
      return computeValue(obj, validBranch.then)
    } else {
      assert(expr['default'], errorMsg)
      return computeValue(obj, expr.default)
    }
  },

  /**
   * Evaluates an expression and returns the first expression if it evaluates to a non-null value.
   * Otherwise, $ifNull returns the second expression's value.
   *
   * @param obj
   * @param expr
   * @returns {*}
   */
  $ifNull (obj, expr) {
    assert(isArray(expr) && expr.length === 2, 'Invalid arguments for $ifNull operator')
    let args = computeValue(obj, expr)
    return isNil(args[0]) ? args[1] : args[0]
  }
}
