// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

import { assert, isNil, isNumber } from '../../../util'
import { computeValue, Options } from '../../../core'
import { truncate } from './_internal'

/**
 * Truncates a number to a whole integer or to a specified decimal place.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
export function $trunc(obj: object, expr: any, options: Options): number | null {
  let arr = computeValue(obj, expr, null, options)
  let num = arr[0]
  let places = arr[1]
  if (isNil(num) || isNaN(num) || Math.abs(num) === Infinity) return num
  assert(isNumber(num), '$trunc expression must resolve to a number.')
  assert(isNil(places) || (isNumber(places) && places > -20 && places < 100), "$trunc expression has invalid place")
  return truncate(num, places, false)
}
