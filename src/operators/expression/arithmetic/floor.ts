// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { assert, isNil, isNumber } from '../../../util'
import { computeValue, Options } from '../../../core'


/**
 * Returns the largest integer less than or equal to the specified number.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $floor(obj: object, expr: any, options: Options): number | null {
  let arg = computeValue(obj, expr, null, options)
  if (isNil(arg)) return null
  assert(isNumber(arg) || isNaN(arg), '$floor expression must resolve to a number.')
  return Math.floor(arg)
}
