// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

import {
  createQueryOperator,
  $mod as __mod,
  $regex as __regex
} from '../.internal/predicates'
import { Callback, isFunction } from '../../util'
import { computeValue, Options } from '../../core'

export const $mod = createQueryOperator(__mod)
export const $regex = createQueryOperator(__regex)

/**
 * Matches documents that satisfy the specified JSON Schema.
 *
 * @param selector
 * @param value
 */
export function $jsonSchema(selector: string, value: any, options: Options): Callback<boolean> {
  throw new Error('$jsonSchema not implemented')
}

/**
 * Matches documents that satisfy a JavaScript expression.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export function $where(selector: string, value: any, options: Options): Callback<boolean> {
  let f: Function
  if (!isFunction(value)) {
    f = new Function('return ' + value + ';')
  } else {
    f = value as Function
  }
  return obj => f.call(obj) === true
}

/**
 * Allows the use of aggregation expressions within the query language.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export function $expr(selector: string, value: any, options: Options): Callback<boolean> {
  return obj => computeValue(obj, value, null, options)
}