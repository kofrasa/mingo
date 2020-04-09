// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { assert, isArray } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Applies a sub-expression to each element of an array and returns the array of resulting values in order.
 *
 * @param obj
 * @param expr
 * @returns {Array|*}
 */
export function $map(obj: object, expr: any, options: Options): any {
  let inputExpr = computeValue(obj, expr.input, null, options)
  assert(isArray(inputExpr), `$map 'input' expression must resolve to an array`)

  let asExpr = expr['as']
  let inExpr = expr['in']

  // HACK: add the "as" expression as a value on the object to take advantage of "resolve()"
  // which will reduce to that value when invoked. The reference to the as expression will be prefixed with "$$".
  // But since a "$" is stripped of before passing the name to "resolve()" we just need to prepend "$" to the key.
  let tempKey = '$' + asExpr
  return inputExpr.map((v: any) => {
    obj[tempKey] = v
    return computeValue(obj, inExpr, null, options)
  })
}
