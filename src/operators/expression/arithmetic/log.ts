// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { assert, isNil, isNumber, isArray } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Calculates the log of a number in the specified base and returns the result as a double.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $log(obj: object, expr: any, options: Options): number | null {
  let args = computeValue(obj, expr, null, options)
  const msg = '$log expression must resolve to array(2) of numbers'

  assert(isArray(args) && args.length === 2, msg)
  if (args.some(isNil)) return null

  assert(args.some(isNaN) || args.every(isNumber), msg)

  return Math.log10(args[0]) / Math.log10(args[1])
}
