import {
  each,
  groupBy,
  isUndefined
} from '../../util'
import { accumulate, computeValue, idKey } from '../../internal'
import { Lazy } from '../../lazy'

/**
 * Groups documents together for the purpose of calculating aggregate values based on a collection of documents.
 *
 * @param collection
 * @param expr
 * @returns {Array}
 */
export function $group (collection, expr) {
  // lookup key for grouping
  const ID_KEY = idKey()
  let id = expr[ID_KEY]

  return Lazy.transform(collection, coll => {
    let partitions = groupBy(coll, obj => computeValue(obj, id, id))

    // remove the group key
    delete expr[ID_KEY]

    let i = 0
    let size = partitions.keys.length

    return () => {

      if (i === size) return Lazy.done()

      let value = partitions.keys[i]
      let obj = {}

      // exclude undefined key value
      if (!isUndefined(value)) {
        obj[ID_KEY] = value
      }

      // compute remaining keys in expression
      each(expr, (val, key) => {
        obj[key] = accumulate(partitions.groups[i], key, val)
      })

      i++
      return Lazy.value(obj)
    }
  })
}