// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { assert, into, isArray, isNil } from '../../../util'
import { computeValue, Options } from '../../../core'


/**
 * Concatenates arrays to return the concatenated array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $concatArrays(obj: object, expr: any, options: Options): any {
  let arr = computeValue(obj, expr, null, options) as any[]
  assert(isArray(arr), '$concatArrays must resolve to an array')

  if (arr.some(isNil)) return null
  return arr.reduce((acc: any[], item: any) => into(acc, item), [])
}
