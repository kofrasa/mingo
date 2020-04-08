// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { Options } from '../../../core'
import { computeDate } from './common'


/**
 * Returns the milliseconds of a date as a number between 0 and 999.
 * @param obj
 * @param expr
 */
export function $millisecond(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  return d.getUTCMilliseconds()
}
