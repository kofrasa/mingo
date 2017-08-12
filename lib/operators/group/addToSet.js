import { unique } from '../../util'

/**
 * Returns an array of all the unique values for the selected field among for each document in that group.
 *
 * @param collection
 * @param expr
 * @returns {*}
 */
export function $addToSet (collection, expr) {
  return unique(this.$push(collection, expr))
}