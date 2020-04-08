// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from '../../../core'
import { slice } from '../../../util'


/**
 * Returns a subset of an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $slice(obj: object, expr: any, ctx: Options): any {
  let arr = computeValue(obj, expr, null, ctx)
  return slice(arr[0], arr[1], arr[2])
}
