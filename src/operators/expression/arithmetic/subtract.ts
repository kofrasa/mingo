// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, Options } from '../../../core'

/**
 * Takes an array that contains two numbers or two dates and subtracts the second value from the first.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $subtract(obj: object, expr: any, options: Options): number {
  let args = computeValue(obj, expr, null, options)
  return args[0] - args[1]
}
