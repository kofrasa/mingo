/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { isEmpty } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Converts a string to lowercase.
 *
 * @param obj
 * @param expr
 * @returns {string}
 */
export function $toLower(obj: object, expr: any, options: Options): any {
  let value = computeValue(obj, expr, null, options)
  return isEmpty(value) ? '' : value.toLowerCase()
}
