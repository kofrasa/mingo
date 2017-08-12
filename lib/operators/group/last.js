import { computeValue } from '../../internal'

/**
 * Returns the last value in a group.
 *
 * @param collection
 * @param expr
 * @returns {*}
 */
export function $last (collection, expr) {
  return collection.length > 0 ? computeValue(collection[collection.length - 1], expr) : undefined
}