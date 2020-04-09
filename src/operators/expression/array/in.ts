// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { assert, isArray, isEqual } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Returns a boolean indicating whether a specified value is in an array.
 *
 * @param {Object} obj
 * @param {Array} expr
 */
export function $in(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  let item = args[0]
  let arr = args[1]
  assert(isArray(arr), '$in second argument must be an array')
  return arr.some(isEqual.bind(null, item))
}
