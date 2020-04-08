/**
 * Conditional Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators
 */

import { assert, isArray, isNil } from '../../../util'
import { computeValue, Options } from '../../../core'


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
