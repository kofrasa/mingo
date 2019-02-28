import { each, groupBy, into, isEmpty, isObject, keys, sortBy, compare } from '../../util'
import { resolve } from '../../internal'

/**
 * Takes all input documents and returns them in a stream of sorted documents.
 *
 * @param collection
 * @param sortKeys
 * @param  {Object} opt
 * @returns {*}
 */
export function $sort (collection, sortKeys, opt) {
  if (!isEmpty(sortKeys) && isObject(sortKeys)) {
    opt = opt || {}
    let cmp = compare
    let collationSpec = opt['collation']

    if (isObject(collationSpec)) {
      // TODO: create a new "cmp" based on the collationSpec.
    }

    return collection.transform(coll => {
      let modifiers = keys(sortKeys)

      each(modifiers.reverse(), (key) => {
        let grouped = groupBy(coll, obj => resolve(obj, key))
        let sortedIndex = {}

        let indexKeys = sortBy(grouped.keys, (k, i) => {
          sortedIndex[k] = i
          return k
        }, cmp)

        if (sortKeys[key] === -1) indexKeys.reverse()
        coll = []
        each(indexKeys, k => into(coll, grouped.groups[sortedIndex[k]]))
      })

      return coll
    })
  }

  return collection
}