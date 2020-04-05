/**
 * Variable Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#variable-expression-operators
 */

import { computeValue, Options } from '../../core'
import { each } from '../../util'

/**
 * Defines variables for use within the scope of a sub-expression and returns the result of the sub-expression.
 *
 * @param obj The target object for this expression
 * @param expr The right-hand side of the operator
 * @param options Options to use for this operattion
 * @returns {*}
 */
export function $let(obj: object, expr: any, options: Options): any {
  let varsExpr = expr.vars
  let inExpr = expr.in

  // resolve vars
  each(varsExpr, (val, key) => {
    let newExpr = computeValue(obj, val, null, options)
    let tempKey = '$' + key
    obj[tempKey] = newExpr
  })

  return computeValue(obj, inExpr, null, options)
}
