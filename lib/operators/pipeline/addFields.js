import { cloneDeep, each, keys } from '../../util'
import { computeValue, resolveObj, setValue } from '../../internal'

/**
 * Adds new fields to documents.
 * Outputs documents that contain all existing fields from the input documents and newly added fields.
 *
 * @param {Array} collection
 * @param {*} expr
 */
export function $addFields (collection, expr) {
  let newFields = keys(expr)

  if (newFields.length === 0) return collection

  return collection.map(obj => {
    let newObj = cloneDeep(obj)
    each(newFields, (field) => {
      let newValue = computeValue(obj, expr[field])
      setValue(newObj, field, newValue)
    })
    return newObj
  })
}