// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from '../../../core'

/**
 * Determines if the operand is an array. Returns a boolean.
 *
 * @param  {Object}  obj
 * @param  {*}  expr
 * @return {Boolean}
 */
export function $isArray(obj: object, expr: any, options: Options): any {
  return computeValue(obj, expr[0], null, options) instanceof Array
}
