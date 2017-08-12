import { clone, each, keys, map } from '../../util'
import { computeValue, traverse } from '../../internal'

/**
 * Adds new fields to documents.
 * Outputs documents that contain all existing fields from the input documents and newly added fields.
 *
 * @param {Array} collection
 * @param {*} expr
 */
export function $addFields (collection, expr) {
  let newFields = keys(expr)

  return map(collection, (obj) => {
    let newObj = clone(obj)
    each(newFields, (field) => {
      let newValue = computeValue(obj, expr[field])
      traverse(newObj, field, (o, key) => {
        o[key] = newValue
      }, true)
    })
    return newObj
  })
}