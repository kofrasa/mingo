import {
  assert,
  clone,
  each,
  getHash,
  isArray,
  isString,
  isNil
} from '../../util'

/**
 * Performs a left outer join to another collection in the same database to filter in documents from the “joined” collection for processing.
 *
 * @param collection
 * @param expr
 */
export function $lookup (collection, expr) {
  let joinColl = expr.from
  let localField = expr.localField
  let foreignField = expr.foreignField
  let asField = expr.as

  assert(isArray(joinColl) && isString(foreignField) && isString(localField) && isString(asField), '$lookup: invalid argument')

  let hash = {}

  each(joinColl, obj => {
    let k = getHash(obj[foreignField], { nullIfEmpty: true })
    hash[k] = hash[k] || []
    hash[k].push(obj)
  })

  return collection.map(obj => {
    let k = getHash(obj[localField], { nullIfEmpty: true })
    let newObj = clone(obj)
    newObj[asField] = hash[k] || []
    return newObj
  })
}