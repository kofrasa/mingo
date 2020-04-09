// $slice operator. https://docs.mongodb.com/manual/reference/operator/projection/slice/#proj._S_slice

import { isArray, resolve } from '../../util'
import { Options } from '../../core'
import { $slice as __slice } from '../expression/array'

/**
 * Limits the number of elements projected from an array. Supports skip and limit slices.
 *
 * @param obj
 * @param field
 * @param expr
 */
export function $slice(obj: object, expr: any, field: string, options: Options): any {
  let xs = resolve(obj, field)

  if (!isArray(xs)) return xs

  return __slice(obj, isArray(expr) ? [xs, ...expr] : [xs , expr], options)
}
