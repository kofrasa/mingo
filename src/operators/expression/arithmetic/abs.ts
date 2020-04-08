// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { computeValue, Options } from '../../../core'
import { isNil } from '../../../util'

/**
 * Returns the absolute value of a number.
 *
 * @param obj
 * @param expr
 * @return {Number|null|NaN}
 */
export function $abs(obj: object, expr: any, options: Options): number | null {
  let val = computeValue(obj, expr, null, options)
  return isNil(val) ? null : Math.abs(val)
}
