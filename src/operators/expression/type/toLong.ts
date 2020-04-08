/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { toInteger } from './_internal'
import { Options } from '../../../core'
import { MAX_LONG, MIN_LONG } from '../../../util'

/**
 * Converts a value to a long. If the value cannot be converted to a long, $toLong errors. If the value is null or missing, $toLong returns null.
 * @param obj
 * @param expr
 */
export function $toLong(obj: object, expr: any, options: Options): number | null {
  return toInteger(obj, expr, options, MAX_LONG, MIN_LONG, 'long')
}
