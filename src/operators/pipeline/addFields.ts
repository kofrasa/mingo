import { cloneDeep, each, keys, setValue } from '../../util'
import { computeValue } from '../../internal'
import { Iterator } from '../../lazy'

/**
 * Adds new fields to documents.
 * Outputs documents that contain all existing fields from the input documents and newly added fields.
 *
 * @param {Array} collection
 * @param {*} expr
 * @param {Object} opt Pipeline options
 */
export function $addFields(collection: Iterator, expr: any, opt?: object): Iterator {
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

/**
 * Alias for $addFields.
 */
export const $set = $addFields