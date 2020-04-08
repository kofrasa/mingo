/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { assert, isEqual, isString, isNil } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Compares two strings and returns an integer that reflects the comparison.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $strcasecmp(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  let a = args[0]
  let b = args[1]
  if (isEqual(a, b) || args.every(isNil)) return 0
  assert(args.every(isString), '$strcasecmp must resolve to array(2) of strings')
  a = a.toUpperCase()
  b = b.toUpperCase()
  return (a > b && 1) || (a < b && -1) || 0
}
