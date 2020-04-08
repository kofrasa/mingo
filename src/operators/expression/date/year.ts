// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { Options } from '../../../core'
import { computeDate } from './common'


/**
 * Returns the year for a date as a number (e.g. 2014).
 * @param obj
 * @param expr
 */
export function $year(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  return d.getUTCFullYear()
}
