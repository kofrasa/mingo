import { isNil, reduce } from '../../util'

/**
 * Returns the highest value in a group.
 *
 * @param collection
 * @param expr
 * @returns {*}
 */
export function $max (collection, expr) {
  return reduce(this.$push(collection, expr), (acc, n) => (isNil(acc) || n > acc) ? n : acc, undefined)
}