// $elemMatch operator. https://docs.mongodb.com/manual/reference/operator/projection/elemMatch/#proj._S_elemMatch

import { assert, isArray, resolve } from '../../util'
import { Query } from '../../query'

/**
 * Projects only the first element from an array that matches the specified $elemMatch condition.
 *
 * @param obj
 * @param field
 * @param expr
 * @returns {*}
 */
export function $elemMatch(obj: object, expr: any, field: string): any {
  let arr = resolve(obj, field)
  let query = new Query(expr)

  assert(isArray(arr), '$elemMatch: argument must resolve to array')

  for (let i = 0; i < arr.length; i++) {
    if (query.test(arr[i])) return [arr[i]]
  }
  return undefined
}
