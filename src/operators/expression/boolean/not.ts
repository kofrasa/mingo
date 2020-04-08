// Boolean Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#boolean-expression-operators

import { computeValue, Options } from '../../../core'

/**
 * Returns the boolean value that is the opposite of its argument expression. Accepts a single argument expression.
 *
 * @param obj
 * @param expr
 * @returns {boolean}
 */
export function $not(obj: object, expr: any, options: Options): any {
  return !computeValue(obj, expr[0], null, options)
}
