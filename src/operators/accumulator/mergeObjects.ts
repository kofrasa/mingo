import { reduce } from '../../util'
import { computeValue } from '../../core'

/**
 * Combines multiple documents into a single document.
 *
 * @param collection
 * @param expr
 * @returns {Array|*}
 */
export function $mergeObjects(collection: any[], expr: any): any {
  return reduce(collection, (memo, o) => Object.assign(memo, computeValue(o, expr)), {})
}