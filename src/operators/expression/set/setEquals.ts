/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { unique, intersection } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Returns true if two sets have the same elements.
 * @param obj
 * @param expr
 */
export function $setEquals(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  let xs = unique(args[0])
  let ys = unique(args[1])
  return xs.length === ys.length && xs.length === intersection(xs, ys).length
}
