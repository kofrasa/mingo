import { isNil } from '../../util'
import { computeValue, Options } from '../../core'

/**
 * Returns an array of all values for the selected field among for each document in that group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {Array|*}
 */
export function $push(collection: any[], expr: any, options: Options): any {
  if (isNil(expr)) return collection
  return collection.map(obj => computeValue(obj, expr, null, options))
}