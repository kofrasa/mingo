import { isNumber } from '../../util'
import { $push } from './push'

/**
 * Returns an average of all the values in a group.
 *
 * @param collection
 * @param expr
 * @returns {number}
 */
export function $avg(collection: any[], expr: any): any {
  let data = $push(collection, expr).filter(isNumber) as number[]
  let sum = data.reduce<number>((acc: number, n: number) => acc + n, 0)
  return sum / (data.length || 1)
}