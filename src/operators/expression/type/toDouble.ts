/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { computeValue, Options } from '../../../core'
import { TypeConvertError } from './_internal'

/**
 * Converts a value to a double. If the value cannot be converted to an double, $toDouble errors. If the value is null or missing, $toDouble returns null.
 *
 * @param obj
 * @param expr
 */
export function $toDouble(obj: object, expr: any, options: Options): number | null {
  let val = computeValue(obj, expr, null, options)

  if (val === null || val === undefined) return null
  if (val instanceof Date) return val.getTime()
  let n = Number(val)
  if (!isNaN(n) && n.toString() === val.toString()) return n
  throw new TypeConvertError(`cannot convert '${val}' to double/decimal`)
}
