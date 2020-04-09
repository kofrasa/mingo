import { isNumber } from '../../util'
import { $push } from './push'
import { Options } from '../../core'
import { stddev } from './_internal'

/**
 * Returns the population standard deviation of the input values.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @return {Number}
 */
export function $stdDevPop(collection: any[], expr: any, options: Options): number {
  return stddev($push(collection, expr, options).filter(isNumber), false)
}