import { isArray, isNumber, reduce } from '../../util'

/**
 * Returns the sum of all the values in a group.
 *
 * @param collection
 * @param expr
 * @returns {*}
 */
export function $sum (collection, expr) {
  if (!isArray(collection)) return 0

  // take a short cut if expr is number literal
  if (isNumber(expr)) return collection.length * expr

  return reduce(this.$push(collection, expr).filter(isNumber), (acc, n) => acc + n, 0)
}