// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


import { computeValue, Options } from '../../../core'

/**
 * Returns an array whose elements are a generated sequence of numbers.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $range(obj: object, expr: any, options: Options): any {
  let arr = computeValue(obj, expr, null, options)
  let start = arr[0]
  let end = arr[1]
  let step = arr[2] || 1

  let result = []

  while ((start < end && step > 0) || (start > end && step < 0)) {
    result.push(start)
    start += step
  }

  return result
}
