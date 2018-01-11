import { isNil, reduce } from '../../util'
import { computeValue } from '../../internal'

/**
 * Combines multiple documents into a single document.
 *
 * @param collection
 * @param expr
 * @returns {Array|*}
 */
export function $mergeObjects (collection, expr) {
  return reduce(collection, (memo, o) => Object.assign(memo, computeValue(o, expr)), {})
}