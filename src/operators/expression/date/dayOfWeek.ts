// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { Options } from '../../../core'
import { computeDate } from './common'


/**
 * Returns the day of the week for a date as a number between 1 (Sunday) and 7 (Saturday).
 * @param obj
 * @param expr
 */
export function $dayOfWeek(obj: object, expr: any, options: Options): number {
  let d = computeDate(obj, expr, options)
  return d.getUTCDay() + 1
}
