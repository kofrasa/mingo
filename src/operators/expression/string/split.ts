/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { assert, isString, isNil } from '../../../util'
import { computeValue, Options } from '../../../core'


/**
 * Splits a string into substrings based on a delimiter.
 * If the delimiter is not found within the string, returns an array containing the original string.
 *
 * @param  {Object} obj
 * @param  {Array} expr
 * @return {Array} Returns an array of substrings.
 */
export function $split(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  if (isNil(args[0])) return null
  assert(args.every(isString), '$split expression must result to array(2) of strings')
  return args[0].split(args[1])
}
