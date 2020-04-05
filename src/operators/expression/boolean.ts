// Boolean Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#boolean-expression-operators

import { computeValue, Options } from '../../core'
import { truthy } from '../../util'

/**
 * Returns true only when all its expressions evaluate to true. Accepts any number of argument expressions.
 *
 * @param obj
 * @param expr
 * @returns {boolean}
 */
export function $and(obj: object, expr: any, options: Options): any {
  let value = computeValue(obj, expr, null, options)
  return truthy(value) && value.every(truthy)
}

/**
 * Returns true when any of its expressions evaluates to true. Accepts any number of argument expressions.
 *
 * @param obj
 * @param expr
 * @returns {boolean}
 */
export function $or(obj: object, expr: any, options: Options): any {
  let value = computeValue(obj, expr, null, options)
  return truthy(value) && value.some(truthy)
}

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
