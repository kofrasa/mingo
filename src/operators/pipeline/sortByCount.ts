import { idKey } from '../../core'
import { $group } from './group'
import { $sort, SortOptions } from './sort'
import { Iterator } from '../../lazy'

/**
 * Groups incoming documents based on the value of a specified expression,
 * then computes the count of documents in each distinct group.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/sortByCount/
 *
 * @param  {Array} collection
 * @param  {Object} expr
 * @param  {Object} opt
 * @return {*}
 */
export function $sortByCount(collection: Iterator, expr: any, opt?: SortOptions): Iterator {
  let newExpr = { count: { $sum: 1 } }
  newExpr[idKey()] = expr

  return $sort(
    $group(collection, newExpr),
    { count: -1 },
    opt
  )
}