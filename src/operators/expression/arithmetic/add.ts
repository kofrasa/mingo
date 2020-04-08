// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { assert, isDate } from '../../../util'
import { computeValue, Options } from '../../../core'


/**
 * Computes the sum of an array of numbers.
 *
 * @param obj
 * @param expr
 * @returns {Object}
 */
export function $add(obj: object, expr: any, options: Options): number | Date {
  let args = computeValue(obj, expr, null, options) as any[]
  let foundDate = false
  let result = args.reduce((acc: number, val: any) => {
    if (isDate(val)) {
      assert(!foundDate, "'$add' can only have one date value")
      foundDate = true
      val = val.getTime()
    }
    // assume val is a number
    acc += val
    return acc
  }, 0)
  return foundDate ? new Date(result) : result
}
