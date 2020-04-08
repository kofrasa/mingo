/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { notInArray } from '../../../util'
import { computeValue, Options } from '../../../core'


/**
 * Returns elements of a set that do not appear in a second set.
 * @param obj
 * @param expr
 */
export function $setDifference(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  return args[0].filter(notInArray.bind(null, args[1]))
}
