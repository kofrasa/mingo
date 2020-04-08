/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { Options } from '../../../core'
import { trimString } from './_internal'


/**
 * Removes whitespace characters, including null, or the specified characters from the beginning of a string.
 *
 * @param obj
 * @param expr
 */
export function $ltrim(obj: object, expr: any, options: Options): any {
  return trimString(obj, expr, options, { left: true, right: false})
}
