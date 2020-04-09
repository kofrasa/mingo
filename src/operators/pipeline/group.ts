import {
  clone,
  each,
  groupBy
} from '../../util'
import { computeValue, Options } from '../../core'
import { Iterator } from '../../lazy'


/**
 * Groups documents together for the purpose of calculating aggregate values based on a collection of documents.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {Array}
 */
export function $group(collection: Iterator, expr: any, options: Options): Iterator {
  // lookup key for grouping
  const ID_KEY = '_id'

  let id = expr[ID_KEY]

  return collection.transform(coll => {
    let partitions = groupBy(coll, obj => computeValue(obj, id, id, options))

    // remove the group key
    expr = clone(expr)
    delete expr[ID_KEY]

    let i = -1
    let size = partitions.keys.length

    return () => {

      if (++i === size) return { done: true }

      let value = partitions.keys[i]
      let obj = {}

      // exclude undefined key value
      if (value !== undefined) {
        obj[ID_KEY] = value
      }

      // compute remaining keys in expression
      each(expr, (val, key) => {
        obj[key] = computeValue(partitions.groups[i], val, key, options)
      })

      return { value: obj, done: false }
    }
  })
}