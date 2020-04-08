/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { computeValue, Options } from '../../../core'
import { isString, isNil } from '../../../util'

/**
 * Converts a value to a boolean.
 *
 * @param obj
 * @param expr
 */
export function $toBool(obj: object, expr: any, options: Options): boolean | null {
  let val = computeValue(obj, expr, null, options)
  if (isNil(val)) return null
  if (isString(val)) return true

  return Boolean(val)
}
