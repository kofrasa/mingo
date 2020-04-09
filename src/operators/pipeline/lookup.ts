import {
  assert,
  each,
  hashCode,
  isArray,
  isString,
  resolve,
  into
} from '../../util'
import { Iterator } from '../../lazy'
import { Options } from '../../core'

/**
 * Performs a left outer join to another collection in the same database to filter in documents from the “joined” collection for processing.
 *
 * @param collection
 * @param expr
 * @param opt
 */
export function $lookup(collection: Iterator, expr: any, options: Options): Iterator {
  let joinColl = expr.from
  let localField = expr.localField
  let foreignField = expr.foreignField
  let asField = expr.as

  assert(isArray(joinColl) && isString(foreignField) && isString(localField) && isString(asField), '$lookup: invalid argument')

  let hash = {}

  each(joinColl, obj => {
    let k = hashCode(resolve(obj, foreignField))
    hash[k] = hash[k] || []
    hash[k].push(obj)
  })

  return collection.map(obj => {
    let k = hashCode(resolve(obj, localField))
    let newObj = into({}, obj)
    newObj[asField] = hash[k] || []
    return newObj
  })
}