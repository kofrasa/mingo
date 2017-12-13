/**
 * Restricts the number of documents in an aggregation pipeline.
 *
 * @param collection
 * @param value
 * @returns {Object|*}
 */
export function $limit (collection, value) {
  return collection.take(value)
}