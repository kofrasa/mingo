/**
 * Skips over a specified number of documents from the pipeline and returns the rest.
 *
 * @param collection
 * @param value
 * @returns {*}
 */
export function $skip (collection, value) {
  return collection.drop(value)
}