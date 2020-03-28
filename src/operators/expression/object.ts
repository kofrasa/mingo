// Object Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators

import {
  assert,
  each,
  isArray,
  isObject,
  reduce
} from '../../util'
import { computeValue } from '../../internal'

/**
 * Converts a document to an array of documents representing key-value pairs.
 */
export function $objectToArray(obj: object, expr: any): any {
  let val = computeValue(obj, expr)
  assert(isObject(val), '$objectToArray expression must resolve to an object')
  let arr = []
  each(val, (v, k) => arr.push({ k, v }))
  return arr
}

/**
 * Combines multiple documents into a single document.
 * @param {*} obj
 * @param {*} expr
 */
export function $mergeObjects(obj: object, expr: any): any {
  let docs = computeValue(obj, expr)
  return isArray(docs) ? reduce(docs, (memo, o) => Object.assign(memo, o), {}): {}
}