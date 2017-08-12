import { idKey } from '../../internal'

/**
 * Groups incoming documents based on the value of a specified expression,
 * then computes the count of documents in each distinct group.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/sortByCount/
 *
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {*}
 */
export function $sortByCount (collection, expr) {
  let newExpr = { count: { $sum: 1 } }
  newExpr[idKey()] = expr

  return this.$sort(
    this.$group(collection, newExpr),
    { count: -1 }
  )
}