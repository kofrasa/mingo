// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { Options } from '../../../core'
import { computeDate, MILLIS_PER_DAY } from './_internal'


/**
 * Returns the day of the year for a date as a number between 1 and 366 (leap year).
 * @param obj
 * @param expr
 */
export function $dayOfYear(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  let start = new Date(d.getUTCFullYear(), 0, 0)
  let diff = d.getTime() - start.getTime()
  return Math.round(diff / MILLIS_PER_DAY)
}
