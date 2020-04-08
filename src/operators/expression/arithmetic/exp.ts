// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { assert, isNil, isNumber } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Raises Euler’s number (i.e. e ) to the specified exponent and returns the result.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $exp(obj: object, expr: any, options: Options): number | null {
  let arg = computeValue(obj, expr, null, options)
  if (isNil(arg)) return null
  assert(isNumber(arg) || isNaN(arg), '$exp expression must resolve to a number.')
  return Math.exp(arg)
}
