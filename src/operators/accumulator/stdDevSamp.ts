import { isNumber, stddev } from '../../util'
import { $push } from './push'
import { Options } from '../../core'

/**
 * Returns the sample standard deviation of the input values.
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {Number|null}
 */
export function $stdDevSamp(collection: any[], expr: any, options: Options): number {
  return stddev($push(collection, expr, options).filter(isNumber), true)
}