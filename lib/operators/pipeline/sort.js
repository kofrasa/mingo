import { each, getHash, groupBy, into, isEmpty, isObject, keys, sortBy } from '../../util'
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

    return Lazy.transform(collection, coll => {
      let modifiers = keys(sortKeys)

      each(modifiers.reverse(), (key) => {
        let grouped = groupBy(coll, (obj) => resolve(obj, key))
        let sortedIndex = {}
        let getIndex = (k) => sortedIndex[getHash(k)]

        let indexKeys = sortBy(grouped.keys, (item, i) => {
          sortedIndex[getHash(item)] = i
          return item
        })

        if (sortKeys[key] === -1) indexKeys.reverse()
        coll = []
        each(indexKeys, (item) => into(coll, grouped.groups[getIndex(item)]))
      })
      return coll
    })
  }
  return collection
}