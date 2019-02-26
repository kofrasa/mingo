import { cloneDeep, each, keys } from '../../util'
import { computeValue, setValue } from '../../internal'

/**
 * Adds new fields to documents.
 * Outputs documents that contain all existing fields from the input documents and newly added fields.
 *
 * @param {Array} collection
 * @param {*} expr
 * @param {Object} opt Pipeline options
 */
export function $addFields (collection, expr, opt) {
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