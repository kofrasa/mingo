import {
  assert,
  clone,
  each,
  hashCode,
  isArray,
  isString
} from '../../util'

/**
 * Performs a left outer join to another collection in the same database to filter in documents from the “joined” collection for processing.
 *
 * @param collection
 * @param expr
 * @param opt
 */
export function $lookup (collection, expr, opt) {
  let joinColl = expr.from
  let localField = expr.localField
  let foreignField = expr.foreignField
  let asField = expr.as

  assert(isArray(joinColl) && isString(foreignField) && isString(localField) && isString(asField), '$lookup: invalid argument')

  let hash = {}

  each(joinColl, obj => {
    let k = hashCode(obj[foreignField])
    hash[k] = hash[k] || []
    hash[k].push(obj)
  })

  return collection.map(obj => {
    let k = hashCode(obj[localField])
    let newObj = clone(obj)
    newObj[asField] = hash[k] || []
    return newObj
  })
}