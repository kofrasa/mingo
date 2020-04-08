// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { assert, isArray, isEqual, isNil } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Searches an array for an occurrence of a specified value and returns the array index of the first occurrence.
 * If the substring is not found, returns -1.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $indexOfArray(obj: object, expr: any, ctx: Options): any {
  let args = computeValue(obj, expr, null, ctx)
  if (isNil(args)) return null

  let arr = args[0]
  let searchValue = args[1]
  if (isNil(arr)) return null

  assert(isArray(arr), '$indexOfArray expression must resolve to an array.')

  let start = args[2] || 0
  let end = args[3]
  if (isNil(end)) end = arr.length
  if (start > end) return -1

  assert(start >= 0 && end >= 0, '$indexOfArray expression is invalid')

  if (start > 0 || end < arr.length) {
    arr = arr.slice(start, end)
  }

  // Array.prototype.findIndex not supported in IE9 hence this workaround
  let index = -1;
  arr.some((v: any, i: number) => {
    let b = isEqual(v, searchValue)
    if (b) index = i
    return b
  })

  return index + start
}
