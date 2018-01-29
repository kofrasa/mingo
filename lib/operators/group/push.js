import { isNil } from '../../util'
import { computeValue } from '../../internal'

/**
 * Returns an array of all values for the selected field among for each document in that group.
 *
 * @param collection
 * @param expr
 * @returns {Array|*}
 */
export function $push (collection, expr) {
  if (isNil(expr)) return collection
  return collection.map(obj => computeValue(obj, expr))
}