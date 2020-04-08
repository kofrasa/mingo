/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { isString } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
 * The index is zero-based.
 *
 * @param obj
 * @param expr
 * @returns {string}
 */
export function $substr(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  let s = args[0]
  let index = args[1]
  let count = args[2]
  if (isString(s)) {
    if (index < 0) {
      return ''
    } else if (count < 0) {
      return s.substr(index)
    } else {
      return s.substr(index, count)
    }
  }
  return ''
}
