import { each, groupBy, into, isEmpty, isObject, keys, sortBy } from '../../util'
import { resolve } from '../../internal'
import { Lazy } from '../../lazy'

/**
 * Takes all input documents and returns them in a stream of sorted documents.
 *
 * @param collection
 * @param sortKeys
 * @returns {*}
 */
export function $sort (collection, sortKeys) {
  if (!isEmpty(sortKeys) && isObject(sortKeys)) {

    collection = collection.transform(coll => {
      let modifiers = keys(sortKeys)

      each(modifiers.reverse(), (key) => {
        let grouped = groupBy(coll, obj => resolve(obj, key))
        let sortedIndex = {}

        let indexKeys = sortBy(grouped.keys, (k, i) => {
          sortedIndex[k] = i
          return k
        })

        if (sortKeys[key] === -1) indexKeys.reverse()
        coll = []
        each(indexKeys, k => into(coll, grouped.groups[sortedIndex[k]]))
      })

      return coll
    })
  }

  return collection
}