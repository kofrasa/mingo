// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from '../../../core'
import { assert, isArray, isNil } from '../../../util'

/**
 * Applies an expression to each element in an array and combines them into a single value.
 *
 * @param {Object} obj
 * @param {*} expr
 */
export function $reduce(obj: object, expr: any, ctx: Options): any {
  let input = computeValue(obj, expr.input, null, ctx) as any[]
  let initialValue = computeValue(obj, expr.initialValue, null, ctx)
  let inExpr = expr['in']

  if (isNil(input)) return null
  assert(isArray(input), "$reduce 'input' expression must resolve to an array")

  return input.reduce((acc, n) => computeValue({ '$value': acc, '$this': n }, inExpr, null, ctx), initialValue)
}
