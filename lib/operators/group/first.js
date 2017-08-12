import { computeValue } from '../../internal'

/**
 * Returns the first value in a group.
 *
 * @param collection
 * @param expr
 * @returns {*}
 */
export function $first (collection, expr) {
  return collection.length > 0 ? computeValue(collection[0], expr) : undefined
}