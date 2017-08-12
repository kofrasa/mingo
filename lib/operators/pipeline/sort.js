import { each, getHash, groupBy, into, isEmpty, isObject, keys, sortBy } from '../../util'
import { resolve } from '../../internal'

/**
 * Takes all input documents and returns them in a stream of sorted documents.
 *
 * @param collection
 * @param sortKeys
 * @returns {*}
 */
export function $sort (collection, sortKeys) {
  if (!isEmpty(sortKeys) && isObject(sortKeys)) {
    let modifiers = keys(sortKeys)
    each(modifiers.reverse(), (key) => {
      let grouped = groupBy(collection, (obj) => resolve(obj, key))
      let sortedIndex = {}
      let getIndex = (k) => sortedIndex[getHash(k)]

      let indexKeys = sortBy(grouped.keys, (item, i) => {
        sortedIndex[getHash(item)] = i
        return item
      })

      if (sortKeys[key] === -1) {
        indexKeys.reverse()
      }
      collection = []
      each(indexKeys, (item) => into(collection, grouped.groups[getIndex(item)]))
    })
  }
  return collection
}