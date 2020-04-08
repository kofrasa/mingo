// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from '../../../core'
import { assert, isArray, isNil, into } from '../../../util'

/**
 * Returns an array with the elements in reverse order.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $reverseArray(obj: object, expr: any, ctx: Options): any {
  let arr = computeValue(obj, expr, null, ctx)

  if (isNil(arr)) return null
  assert(isArray(arr), '$reverseArray expression must resolve to an array')

  let result = []
  into(result, arr)
  result.reverse()
  return result
}
