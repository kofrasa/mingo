import { $push } from './push'
import { Options } from '../../core'

/**
 * Returns the lowest value in a group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} The options to use for this operator
 * @returns {*}
 */
export function $min(collection: any[], expr: any, options: Options): any {
  let nums = $push(collection, expr, options) as number[]
  let n = nums.reduce((acc, n) => n < acc ? n : acc, Infinity)
  return n === Infinity ? undefined : n
}