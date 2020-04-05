import { $group } from './group'
import { $sort } from './sort'
import { Iterator } from '../../lazy'
import { Options } from '../../core'

/**
 * Groups incoming documents based on the value of a specified expression,
 * then computes the count of documents in each distinct group.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/sortByCount/
 *
 * @param  {Array} collection
 * @param  {Object} expr
 * @param  {Object} options
 * @return {*}
 */
export function $sortByCount(collection: Iterator, expr: any, options: Options): Iterator {
  let newExpr = { count: { $sum: 1 } }

  newExpr['_id'] = expr

  return $sort(
    $group(collection, newExpr, options),
    { count: -1 },
    options
  )
}