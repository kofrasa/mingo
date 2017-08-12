import { isNumber } from '../../util'
import { stddev } from '../../internal'

/**
 * Returns the sample standard deviation of the input values.
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {Number|null}
 */
export function $stdDevSamp (collection, expr) {
  return stddev({
    data: this.$push(collection, expr).filter(isNumber),
    sampled: true
  })
}