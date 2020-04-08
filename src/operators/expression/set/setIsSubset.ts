/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { intersection } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Returns true if all elements of a set appear in a second set.
 * @param obj
 * @param expr
 */
export function $setIsSubset(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  return intersection(args[0], args[1]).length === args[0].length
}
