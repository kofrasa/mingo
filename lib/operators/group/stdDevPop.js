import { isNumber, stddev } from '../../util'
import { $push } from './push'

/**
 * Returns the population standard deviation of the input values.
 *
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {Number}
 */
export function $stdDevPop (collection, expr) {
  return stddev($push(collection, expr).filter(isNumber), false)
}