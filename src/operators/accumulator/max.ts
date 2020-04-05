import { $push } from './push'
import { Options } from '../../core'

/**
 * Returns the highest value in a group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
export function $max(collection: any[], expr: any, options: Options): any {
  let nums = $push(collection, expr, options) as number[]
  let n = nums.reduce((acc, n) => n > acc ? n : acc, -Infinity)
  return n === -Infinity ? undefined : n
}