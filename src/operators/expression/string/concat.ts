/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { inArray } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Concatenates two strings.
 *
 * @param obj
 * @param expr
 * @returns {string|*}
 */
export function $concat(obj: object, expr: any, options: Options): any {
  let args = computeValue(obj, expr, null, options)
  // does not allow concatenation with nulls
  if ([null, undefined].some(inArray.bind(null, args))) return null
  return args.join('')
}
