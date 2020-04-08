// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, Options } from '../../../core'


/**
 * Takes two numbers and divides the first number by the second.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $divide(obj: object, expr: any, options: Options): number {
  let args = computeValue(obj, expr, null, options)
  return args[0] / args[1]
}
