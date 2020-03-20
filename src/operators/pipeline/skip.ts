import { Iterator } from '../../lazy'


/**
 * Skips over a specified number of documents from the pipeline and returns the rest.
 *
 * @param collection
 * @param value
 * @param  {Object} opt
 * @returns {*}
 */
export function $skip(collection: Iterator, expr: number, opt?: object): Iterator {
  return collection.drop(expr)
}