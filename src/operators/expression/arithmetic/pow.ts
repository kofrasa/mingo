// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { assert, isNumber, isArray } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Raises a number to the specified exponent and returns the result.
 *
 * @param obj
 * @param expr
 * @returns {Object}
 */
export function $pow(obj: object, expr: any, options: Options): number {
  let args = computeValue(obj, expr, null, options)

  assert(isArray(args) && args.length === 2 && args.every(isNumber), '$pow expression must resolve to array(2) of numbers')
  assert(!(args[0] === 0 && args[1] < 0), '$pow cannot raise 0 to a negative exponent')

  return Math.pow(args[0], args[1])
}
