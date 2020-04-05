import { computeValue, Options } from '../../core'

/**
 * Combines multiple documents into a single document.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {Array|*}
 */
export function $mergeObjects(collection: any[], expr: any, options: Options): any {
  return collection.reduce((memo, o) => Object.assign(memo, computeValue(o, expr, null, options)), {})
}