/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */

import { truthy } from '../../../util'
import { computeValue, Options } from '../../../core'


/**
 * Returns true if any elements of a set evaluate to true, and false otherwise.
 * @param obj
 * @param expr
 */
export function $anyElementTrue(obj: object, expr: any, options: Options): any {
  // mongodb nests the array expression in another
  let args = computeValue(obj, expr, null, options)[0]
  return args.some(truthy)
}
