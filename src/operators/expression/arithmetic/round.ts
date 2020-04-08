// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { assert, isNil, isNumber } from '../../../util'
import { computeValue, Options } from '../../../core'
import { truncate } from './_internal'

/**
 * Rounds a number to to a whole integer or to a specified decimal place.
 * @param {*} obj
 * @param {*} expr
 */
export function $round(obj: object, expr: any, options: Options): number | null {
  let args = computeValue(obj, expr, null, options)
  let num = args[0]
  let place = args[1]
  if (isNil(num) || isNaN(num) || Math.abs(num) === Infinity) return num
  assert(isNumber(num), '$round expression must resolve to a number.')

  return truncate(num, place, true)
}
