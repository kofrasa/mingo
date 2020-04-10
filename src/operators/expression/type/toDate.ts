/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { computeValue, Options } from '../../../core'
import { TypeConvertError } from './_internal'
import { isNil } from '../../../util'


/**
 * Converts a value to a date. If the value cannot be converted to a date, $toDate errors. If the value is null or missing, $toDate returns null.
 *
 * @param obj
 * @param expr
 */
export function $toDate(obj: object, expr: any, options: Options): Date | null {
  let val = computeValue(obj, expr, null, options)

  if (val instanceof Date) return val
  if (isNil(val)) return null

  let d = new Date(val)
  let n = d.getTime()
  if (!isNaN(n)) return d

  throw new TypeConvertError(`cannot convert '${val}' to date`)
}
