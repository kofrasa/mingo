import { isNumber, stddev } from '../../util'
import { $push } from './push'

/**
 * Returns the sample standard deviation of the input values.
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {Number|null}
 */
export function $stdDevSamp (collection, expr) {
  return stddev($push(collection, expr).filter(isNumber), true)
}