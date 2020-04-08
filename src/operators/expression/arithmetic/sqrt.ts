// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { assert, isNil, isNumber } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Calculates the square root of a positive number and returns the result as a double.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $sqrt(obj: object, expr: any, options: Options): number | null {
  let n = computeValue(obj, expr, null, options)
  if (isNil(n)) return null
  assert(isNumber(n) && n > 0 || isNaN(n), '$sqrt expression must resolve to non-negative number.')
  return Math.sqrt(n)
}
