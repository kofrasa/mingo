import { unique } from '../../util'
import { $push } from './push'

/**
 * Returns an array of all the unique values for the selected field among for each document in that group.
 *
 * @param collection
 * @param expr
 * @returns {*}
 */
export function $addToSet(collection: any[], expr: any): any {
  return unique($push(collection, expr))
}