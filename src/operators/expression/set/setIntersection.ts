/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { intersection } from '../../../util'
import { computeValue, Options } from '../../../core'


/**
 * Returns the common elements of the input sets.
 * @param obj
 * @param expr
 */
export function $setIntersection(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  return intersection(args[0], args[1], options?.hashFunction)
}
