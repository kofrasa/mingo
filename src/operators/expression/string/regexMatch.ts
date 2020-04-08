/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { Options } from '../../../core'
import { regexSearch } from './_internal'


/**
 * Applies a regular expression (regex) to a string and returns a boolean that indicates if a match is found or not.
 *
 * @param obj
 * @param expr
 */
export function $regexMatch(obj: object, expr: any, options: Options): any {
  return regexSearch(obj, expr, options, { global: false }).length != 0
}