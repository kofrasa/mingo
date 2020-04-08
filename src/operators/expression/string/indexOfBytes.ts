/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { assert, isString, isNil, isNumber } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Searches a string for an occurrence of a substring and returns the UTF-8 code point index of the first occurence.
 * If the substring is not found, returns -1.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $indexOfBytes(obj: object, expr: any, options: Options): any {
  let arr = computeValue(obj, expr, null, options)
  const errorMsg = '$indexOfBytes expression resolves to invalid an argument'

  if (isNil(arr[0])) return null

  assert(isString(arr[0]) && isString(arr[1]), errorMsg)

  let str = arr[0]
  let searchStr = arr[1]
  let start = arr[2]
  let end = arr[3]

  let valid = isNil(start) || (isNumber(start) && start >= 0 && Math.round(start) === start)
  valid = valid && (isNil(end) || (isNumber(end) && end >= 0 && Math.round(end) === end))
  assert(valid, errorMsg)

  start = start || 0
  end = end || str.length

  if (start > end) return -1

  let index = str.substring(start, end).indexOf(searchStr)
  return (index > -1)
    ? index + start
    : index
}
