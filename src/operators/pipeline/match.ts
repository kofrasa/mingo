import { Query } from '../../query'
import { Iterator } from '../../lazy'
import { Options } from '../../core'


/**
 * Filters the document stream, and only allows matching documents to pass into the next pipeline stage.
 * $match uses standard MongoDB queries.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {Array|*}
 */
export function $match(collection: Iterator, expr: any, options: Options): Iterator {
  let q = new Query(expr, options)
  return collection.filter(o => q.test(o))
}