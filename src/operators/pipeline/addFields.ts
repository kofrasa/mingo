import { cloneDeep, each, keys, setValue, removeValue } from '../../util'
import { computeValue, Options } from '../../core'
import { Iterator } from '../../lazy'

/**
 * Adds new fields to documents.
 * Outputs documents that contain all existing fields from the input documents and newly added fields.
 *
 * @param {Iterator} collection
 * @param {Object} expr
 * @param {Options} options
 */
export function $addFields(collection: Iterator, expr: any, options: Options): Iterator {
  let newFields = keys(expr)

  if (newFields.length === 0) return collection

  return collection.map(obj => {
    let newObj = cloneDeep(obj)
    each(newFields, (field) => {
      let newValue = computeValue(obj, expr[field], null, options)
      if (newValue !== undefined) {
        setValue(newObj, field, newValue)
      } else {
        removeValue(newObj, field)
      }
    })
    return newObj
  })
}