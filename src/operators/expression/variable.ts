/**
 * Variable Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#variable-expression-operators
 */

import { computeValue } from '../../core'

/**
 * Defines variables for use within the scope of a sub-expression and returns the result of the sub-expression.
 *
 * @param obj
 * @param expr
 * @returns {*}
 */
export function $let(obj: object, expr: any): any {
  let varsExpr = expr.vars
  let inExpr = expr.in

  // resolve vars
  Object.keys(varsExpr).forEach(key => {
    let val = computeValue(obj, varsExpr[key])
    let tempKey = '$' + key
    obj[tempKey] = val
  })

  return computeValue(obj, inExpr)
}