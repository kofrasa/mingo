import { isNumber } from '../../util'
import { stddev } from '../../internal'

/**
 * Returns the population standard deviation of the input values.
 *
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {Number}
 */
export function $stdDevPop (collection, expr) {
  return stddev({
    data: this.$push(collection, expr).filter(isNumber),
    sampled: false
  })
}