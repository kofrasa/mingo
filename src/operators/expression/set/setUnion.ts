/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { union } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Returns a set that holds all elements of the input sets.
 * @param obj
 * @param expr
 */
export function $setUnion(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  return union(args[0], args[1])
}
