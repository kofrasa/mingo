// $slice operator. https://docs.mongodb.com/manual/reference/operator/projection/slice/#proj._S_slice

import {
  assert,
  isArray,
  isNumber,
  resolve,
  slice
} from '../../util'

/**
 * Limits the number of elements projected from an array. Supports skip and limit slices.
 *
 * @param obj
 * @param field
 * @param expr
 */
export function $slice(obj: object, expr: any, field: string): any {
  let xs = resolve(obj, field)

  if (!isArray(xs)) return xs

  if (isArray(expr)) {
    return slice(xs, expr[0], expr[1])
  } else {
    assert(isNumber(expr), '$slice: invalid arguments for projection')
    return slice(xs, expr)
  }
}
