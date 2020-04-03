import { computeValue } from '../../core'

/**
 * Combines multiple documents into a single document.
 *
 * @param collection
 * @param expr
 * @returns {Array|*}
 */
export function $mergeObjects(collection: any[], expr: any): any {
  return collection.reduce((memo, o) => Object.assign(memo, computeValue(o, expr)), {})
}