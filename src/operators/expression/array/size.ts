// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from '../../../core'
import { isArray } from '../../../util'


/**
 * Counts and returns the total the number of items in an array.
 *
 * @param obj
 * @param expr
 */
export function $size(obj: object, expr: any, ctx: Options): any {
  let value = computeValue(obj, expr, null, ctx)
  return isArray(value) ? value.length : undefined
}
