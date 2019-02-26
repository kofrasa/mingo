import { Query } from '../../query.js'

/**
 * Filters the document stream, and only allows matching documents to pass into the next pipeline stage.
 * $match uses standard MongoDB queries.
 *
 * @param collection
 * @param expr
 * @param opt
 * @returns {Array|*}
 */
export function $match (collection, expr, opt) {
  let q = new Query(expr)
  return collection.filter(o => q.test(o))
}