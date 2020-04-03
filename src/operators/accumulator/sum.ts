import { isArray, isNumber } from '../../util'
import { $push } from './push'

/**
 * Returns the sum of all the values in a group.
 *
 * @param collection
 * @param expr
 * @returns {*}
 */
export function $sum(collection: any[], expr: any): any {
  if (!isArray(collection)) return 0

  // take a short cut if expr is number literal
  if (isNumber(expr)) return collection.length * expr
  let nums = $push(collection, expr).filter(isNumber) as number[]
  return nums.reduce((acc, n) => acc + n, 0)
}