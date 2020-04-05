import { unique } from '../../util'
import { $push } from './push'
import { Options } from '../../core'

/**
 * Returns an array of all the unique values for the selected field among for each document in that group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
export function $addToSet(collection: any[], expr: any, options: Options): any {
  return unique($push(collection, expr, options))
}