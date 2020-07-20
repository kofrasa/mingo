// Boolean Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#boolean-expression-operators

import { computeValue, Options } from '../../../core'
import { ensureArray, assert } from '../../../util'

/**
 * Returns the boolean value that is the opposite of its argument expression. Accepts a single argument expression.
 *
 * @param obj Document from collection
 * @param expr Right hand side expression of operator
 * @returns {boolean}
 */
export function $not(obj: object, expr: any, options: Options): any {
  let booleanExpr = ensureArray(expr)
  assert(booleanExpr.length === 1, "Expression $not takes exactly 1 argument")
  return !computeValue(obj, booleanExpr[0], null, options)
}
