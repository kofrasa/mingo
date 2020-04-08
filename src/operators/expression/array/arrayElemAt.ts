// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


import { computeValue, Options } from '../../../core'
import { assert, isArray, isNil } from '../../../util'

/**
 * Returns the element at the specified array index.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $arrayElemAt(obj: object, expr: any, ctx: Options): any {
  let args = computeValue(obj, expr, null, ctx)
  assert(isArray(args) && args.length === 2, '$arrayElemAt expression must resolve to array(2)')

  if (args.some(isNil)) return null

  let index = args[1]
  let arr = args[0]
  if (index < 0 && Math.abs(index) <= arr.length) {
    return arr[(index + arr.length) % arr.length]
  } else if (index >= 0 && index < arr.length) {
    return arr[index]
  }
  return undefined
}
