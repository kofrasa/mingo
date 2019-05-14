import { isNumber, stddev } from '../../util'

/**
 * Returns the population standard deviation of the input values.
 *
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {Number}
 */
export function $stdDevPop (collection, expr) {
  return stddev(this.$push(collection, expr).filter(isNumber), false)
}