import {
  assert,
  clone,
  each,
  err,
  getType,
  getHash,
  has,
  inArray,
  intersection,
  isArray,
  isBoolean,
  isDate,
  isEmpty,
  isEqual,
  isFunction,
  isNil,
  isNull,
  isNumber,
  isObject,
  isObjectLike,
  isRegExp,
  isString,
  isUndefined,
  map,
  notInArray,
  unique
} from '../util'
import { computeValue, stddev } from '../internal.js'

/**
 * Group stage Accumulator Operators. https://docs.mongodb.com/manual/reference/operator/aggregation-group/
 */

export const groupOperators = {

  /**
   * Returns an array of all the unique values for the selected field among for each document in that group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */
  $addToSet (collection, expr) {
    return unique(this.$push(collection, expr))
  },

  /**
   * Returns the sum of all the values in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */
  $sum (collection, expr) {
    if (!isArray(collection)) return 0

    if (isNumber(expr)) {
      // take a short cut if expr is number literal
      return collection.length * expr
    }
    return this.$push(collection, expr).filter(isNumber).reduce((acc, n) => acc + n, 0)
  },

  /**
   * Returns the highest value in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */
  $max (collection, expr) {
    let mapped = this.$push(collection, expr)
    return mapped.reduce((acc, n) => (isNil(acc) || n > acc) ? n : acc, undefined)
  },

  /**
   * Returns the lowest value in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */
  $min (collection, expr) {
    let mapped = this.$push(collection, expr)
    return mapped.reduce((acc, n) => (isNil(acc) || n < acc) ? n : acc, undefined)
  },

  /**
   * Returns an average of all the values in a group.
   *
   * @param collection
   * @param expr
   * @returns {number}
   */
  $avg (collection, expr) {
    let data = this.$push(collection, expr).filter(isNumber)
    let sum = data.reduce((acc, n) => acc + n, 0)
    return sum / (data.length || 1)
  },

  /**
   * Returns an array of all values for the selected field among for each document in that group.
   *
   * @param collection
   * @param expr
   * @returns {Array|*}
   */
  $push (collection, expr) {
    if (isNil(expr)) return collection
    return collection.map((obj) => computeValue(obj, expr, null))
  },

  /**
   * Returns the first value in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */
  $first (collection, expr) {
    return (collection.length > 0) ? computeValue(collection[0], expr) : undefined
  },

  /**
   * Returns the last value in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */
  $last (collection, expr) {
    return (collection.length > 0) ? computeValue(collection[collection.length - 1], expr) : undefined
  },

  /**
   * Returns the population standard deviation of the input values.
   * @param  {Array} collection
   * @param  {Object} expr
   * @return {Number}
   */
  $stdDevPop (collection, expr) {
    let data = this.$push(collection, expr).filter(isNumber)
    return stddev({ data: data, sampled: false })
  },

  /**
   * Returns the sample standard deviation of the input values.
   * @param  {Array} collection
   * @param  {Object} expr
   * @return {Number|null}
   */
  $stdDevSamp (collection, expr) {
    let data = this.$push(collection, expr).filter(isNumber)
    return stddev({ data: data, sampled: true })
  }
}
