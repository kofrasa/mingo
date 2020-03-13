import { unique } from '../../util'
import { $push } from './push'

/**
 * Returns an array of all the unique values for the selected field among for each document in that group.
 *
 * @param collection
 * @param expr
 * @returns {*}
 */
export function $addToSet (collection, expr) {
  return unique($push(collection, expr))
}