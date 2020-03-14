import { isNumber, reduce } from '../../util'
import { $push } from './push'

/**
 * Returns an average of all the values in a group.
 *
 * @param collection
 * @param expr
 * @returns {number}
 */
export function $avg (collection, expr) {
  let data = $push(collection, expr).filter(isNumber)
  let sum = reduce(data, (acc, n) => acc + n, 0)
  return sum / (data.length || 1)
}