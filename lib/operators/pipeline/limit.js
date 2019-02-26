/**
 * Restricts the number of documents in an aggregation pipeline.
 *
 * @param collection
 * @param value
 * @param opt
 * @returns {Object|*}
 */
export function $limit (collection, value, opt) {
  return collection.take(value)
}