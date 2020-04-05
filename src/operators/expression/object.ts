// Object Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators

import {
  assert,
  each,
  isObject
} from '../../util'
import { computeValue, Options } from '../../core'

/**
 * Converts a document to an array of documents representing key-value pairs.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
export function $objectToArray(obj: object, expr: any, options: Options): any {
  let val = computeValue(obj, expr, null, options)
  assert(isObject(val), '$objectToArray expression must resolve to an object')
  let arr = []
  each(val, (v, k) => arr.push({ k, v }))
  return arr
}

/**
 * Combines multiple documents into a single document.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
export function $mergeObjects(obj: object, expr: any, options: Options): any {
  let docs = computeValue(obj, expr, null, options)
  return docs instanceof Array ? docs.reduce((memo, o) => Object.assign(memo, o), {}): {}
}