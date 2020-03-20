import { Iterator } from '../../lazy'


/**
 * Restricts the number of documents in an aggregation pipeline.
 *
 * @param collection
 * @param value
 * @param opt
 * @returns {Object|*}
 */
export function $limit(collection: Iterator, expr: number, opt?: object): Iterator {
  return collection.take(expr)
}