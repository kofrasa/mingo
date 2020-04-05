import { computeValue, Options } from '../../core'

/**
 * Returns the last value in the collection.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
export function $last(collection: any[], expr: any, options: Options): any {
  return collection.length > 0 ? computeValue(collection[collection.length - 1], expr, null, options) : undefined
}