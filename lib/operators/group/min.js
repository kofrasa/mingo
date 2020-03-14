import { isNil, reduce } from '../../util'
import { $push } from './push'

/**
 * Returns the lowest value in a group.
 *
 * @param collection
 * @param expr
 * @returns {*}
 */
export function $min (collection, expr) {
  return reduce($push(collection, expr), (acc, n) => (isNil(acc) || n < acc) ? n : acc, undefined)
}