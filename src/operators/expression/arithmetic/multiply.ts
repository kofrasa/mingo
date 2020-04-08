// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, Options } from '../../../core'


/**
 * Computes the product of an array of numbers.
 *
 * @param obj
 * @param expr
 * @returns {Object}
 */
export function $multiply(obj: object, expr: any, options: Options): number {
  let args = computeValue(obj, expr, null, options) as number[]
  return args.reduce((acc, num) => acc * num, 1)
}
