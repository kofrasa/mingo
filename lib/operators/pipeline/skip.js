/**
 * Skips over a specified number of documents from the pipeline and returns the rest.
 *
 * @param collection
 * @param value
 * @param  {Object} opt
 * @returns {*}
 */
export function $skip (collection, value, opt) {
  return collection.drop(value)
}