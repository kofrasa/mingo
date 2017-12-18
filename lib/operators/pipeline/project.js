import {
  assert,
  cloneDeep,
  each,
  ensureArray,
  inArray,
  isEmpty,
  isNil,
  isNumber,
  isObject,
  isString,
  isUndefined,
  keys,
  notInArray,
} from '../../util'
import {
  computeValue,
  idKey,
  removeValue,
  resolveObj,
  setValue
} from '../../internal'
import { projectionOperators } from '../projection.js'
import { OP_PROJECTION } from '../../constants.js'
import { ops } from '../index.js'

/**
 * Reshapes a document stream.
 * $project can rename, add, or remove fields as well as create computed values and sub-documents.
 *
 * @param collection
 * @param expr
 * @returns {Array}
 */
export function $project (collection, expr) {
  if (isEmpty(expr)) return collection

  // result collection
  let objKeys = keys(expr)
  let idOnlyExcludedExpression = false
  const ID_KEY = idKey()

  // validate inclusion and exclusion
  let check = [false, false]
  each(expr, (v, k) => {
    if (k === ID_KEY) return
    if (v === 0 || v === false) {
      check[0] = true
    } else {
      check[1] = true
    }
    assert(check[0] !== check[1], 'Projection cannot have a mix of inclusion and exclusion.')
  })

  if (inArray(objKeys, ID_KEY)) {
    let id = expr[ID_KEY]
    if (id === 0 || id === false) {
      objKeys = objKeys.filter(notInArray.bind(null, [ID_KEY]))
      assert(notInArray(objKeys, ID_KEY), 'Must not contain collections id key')
      idOnlyExcludedExpression = isEmpty(objKeys)
    }
  } else {
    // if not specified the add the ID field
    objKeys.push(ID_KEY)
  }

  return collection.map(obj => {
    let newObj = {}
    let foundSlice = false
    let foundExclusion = false
    let dropKeys = []

    if (idOnlyExcludedExpression) {
      dropKeys.push(ID_KEY)
    }

    each(objKeys, (key) => {
      let subExpr = expr[key]
      let value // final computed value of the key

      if (key !== ID_KEY && inArray([0, false], subExpr)) {
        foundExclusion = true
      }

      if (key === ID_KEY && isEmpty(subExpr)) {
        // tiny optimization here to skip over id
        value = obj[key]
      } else if (isString(subExpr)) {
        value = computeValue(obj, subExpr, key)
      } else if (inArray([1, true], subExpr)) {
        // For direct projections, we use the resolved object value
      } else if (isObject(subExpr)) {
        let operator = keys(subExpr)
        operator = operator.length > 1 ? false : operator[0]

        if (inArray(ops(OP_PROJECTION), operator)) {
          // apply the projection operator on the operator expression for the key
          if (operator === '$slice') {
            // $slice is handled differently for aggregation and projection operations
            if (ensureArray(subExpr[operator]).every(isNumber)) {
              // $slice for projection operation
              value = projectionOperators[operator](obj, subExpr[operator], key)
              foundSlice = true
            } else {
              // $slice for aggregation operation
              value = computeValue(obj, subExpr, key)
            }
          } else {
            value = projectionOperators[operator](obj, subExpr[operator], key)
          }
        } else {
          // compute the value for the sub expression for the key
          value = computeValue(obj, subExpr, key)
        }
      } else {
        dropKeys.push(key)
        return
      }

      // get value with object graph
      let objPathValue = resolveObj(obj, key)

      // add the value at the path
      if (!isUndefined(objPathValue)) {
        Object.assign(newObj, objPathValue)
      }

      // if computed add/or remove accordingly
      if (notInArray([0, 1, false, true], subExpr)) {
        if (isUndefined(value)) {
          removeValue(newObj, key)
        } else {
          setValue(newObj, key, value)
        }
      }
    })
    // if projection included $slice operator
    // Also if exclusion fields are found or we want to exclude only the id field
    // include keys that were not explicitly excluded
    if (foundSlice || foundExclusion || idOnlyExcludedExpression) {
      newObj = Object.assign({}, obj, newObj)
      if (dropKeys.length > 0) {
        newObj = cloneDeep(newObj)
        each(dropKeys, (key) => removeValue(newObj, key))
      }
    }
    return newObj
  })
}