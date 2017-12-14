import { Query } from '../../query.js'

/**
 * Filters the document stream, and only allows matching documents to pass into the next pipeline stage.
 * $match uses standard MongoDB queries.
 *
 * @param collection
 * @param expr
 * @returns {Array|*}
 */
export function $match (collection, expr) {
  let q = new Query(expr)
  return collection.filter(o => q.test(o))
}