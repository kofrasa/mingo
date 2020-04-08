// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { assert, has, isArray, isObject } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Converts an array of key value pairs to a document.
 */
export function $arrayToObject(obj: object, expr: any, ctx: Options): any {
  let arr = computeValue(obj, expr, null, ctx) as any[]
  assert(isArray(arr), '$arrayToObject expression must resolve to an array')

  return arr.reduce((newObj, val) => {
    if (isArray(val) && val.length == 2) {
      newObj[val[0]] = val[1]
    } else {
      assert(isObject(val) && has(val, 'k') && has(val, 'v'), '$arrayToObject expression is invalid.')
      newObj[val.k] = val.v
    }
    return newObj
  }, {})
}
