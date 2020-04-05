import {
  assert,
  cloneDeep,
  each,
  ensureArray,
  filterMissing,
  has,
  inArray,
  isEmpty,
  isNil,
  isNumber,
  isObject,
  isString,
  keys,
  notInArray,
  merge,
  removeValue,
  resolveGraph,
  setValue,
  isOperator
} from '../../util'
import { computeValue, getOperator, OperatorType, Options } from '../../core'
import { Iterator } from '../../lazy'


/**
 * Reshapes a document stream.
 * $project can rename, add, or remove fields as well as create computed values and sub-documents.
 *
 * @param collection
 * @param expr
 * @param opt
 * @returns {Array}
 */
export function $project(collection: Iterator, expr: any, options: Options): Iterator {
  if (isEmpty(expr)) return collection

  // result collection
  let expressionKeys = keys(expr)
  let idOnlyExcluded = false

  // validate inclusion and exclusion
  validateExpression(expr, options)

  const ID_KEY = options.config.idKey

  if (inArray(expressionKeys, ID_KEY)) {
    let id = expr[ID_KEY]
    if (id === 0 || id === false) {
      expressionKeys = expressionKeys.filter(notInArray.bind(null, [ID_KEY]))
      idOnlyExcluded = expressionKeys.length == 0
    }
  } else {
    // if not specified the add the ID field
    expressionKeys.push(ID_KEY)
  }

  return collection.map(obj => processObject(obj, expr, options, expressionKeys, idOnlyExcluded))
}

/**
 * Process the expression value for $project operators
 *
 * @param {Object} obj The object to use as options
 * @param {Object} expr The experssion object of $project operator
 * @param {Array} expressionKeys The key in the 'expr' object
 * @param {Boolean} idOnlyExcluded Boolean value indicating whether only the ID key is excluded
 */
function processObject(obj: object, expr: any, options: Options, expressionKeys: string[], idOnlyExcluded: boolean): object {

  let newObj = new Object
  let foundSlice = false
  let foundExclusion = false
  let dropKeys: string[] = []

  const ID_KEY = options.config.idKey

  if (idOnlyExcluded) {
    dropKeys.push(ID_KEY)
  }

  expressionKeys.forEach((key: string) => {
    // final computed value of the key
    let value: any = undefined

    // expression to associate with key
    let subExpr = expr[key]

    if (key !== ID_KEY && inArray([0, false], subExpr)) {
      foundExclusion = true
    }

    if (key === ID_KEY && isEmpty(subExpr)) {
      // tiny optimization here to skip over id
      value = obj[key]
    } else if (isString(subExpr)) {
      value = computeValue(obj, subExpr, key, options)
    } else if (inArray([1, true], subExpr)) {
      // For direct projections, we use the resolved object value
    } else if (subExpr instanceof Array) {
      value = subExpr.map(v => {
        let r = computeValue(obj, v, null, options)
        if (isNil(r)) return null
        return r
      })
    } else if (isObject(subExpr)) {
      let subExprKeys = keys(subExpr)
      let operator = subExprKeys.length == 1 ? subExprKeys[0] : null

      // first try a projection operator
      let call = getOperator(OperatorType.PROJECTION, operator)
      if (call) {
        // apply the projection operator on the operator expression for the key
        if (operator === '$slice') {
          // $slice is handled differently for aggregation and projection operations
          if (ensureArray(subExpr[operator]).every(isNumber)) {
            // $slice for projection operation
            value = call(obj, subExpr[operator], key)
            foundSlice = true
          } else {
            // $slice for aggregation operation
            value = computeValue(obj, subExpr, key, options)
          }
        } else {
          value = call(obj, subExpr[operator], key, options)
        }
      } else if (isOperator(operator)) {
        // compute if operator key
        value = computeValue(obj, subExpr[operator], operator, options)
      } else if (has(obj, key)) {
        // compute the value for the sub expression for the key
        validateExpression(subExpr, options)
        let target = obj[key]
        if (target instanceof Array) {
          value = target.map(o => processObject(o, subExpr, options, subExprKeys, false))
        } else {
          target = isObject(target) ? target : obj
          value = processObject(target, subExpr, options, subExprKeys, false)
        }
      } else {
        // compute the value for the sub expression for the key
        value = computeValue(obj, subExpr, null, options)
      }
    } else {
      dropKeys.push(key)
      return
    }

    // get value with object graph
    let objPathGraph = resolveGraph(obj, key, {
      preserveMissing: true
    })

    // add the value at the path
    if (objPathGraph !== undefined) {
      merge(newObj, objPathGraph, {
        flatten: true
      })
    }

    // if computed add/or remove accordingly
    if (notInArray([0, 1, false, true], subExpr)) {
      if (value === undefined) {
        removeValue(newObj, key)
      } else {
        setValue(newObj, key, value)
      }
    }
  })

  // filter out all missing values preserved to support correct merging
  filterMissing(newObj)

  // For the following cases we include all keys on the object that were not explicitly excluded.
  //
  // 1. projection included $slice operator
  // 2. some fields were explicitly excluded
  // 3. only the id field was excluded
  if (foundSlice || foundExclusion || idOnlyExcluded) {
    newObj = Object.assign({}, obj, newObj)
    if (dropKeys.length > 0) {
      newObj = cloneDeep(newObj)
      each(dropKeys, k => removeValue(newObj, k))
    }
  }

  return newObj
}

/**
 * Validate inclusion and exclusion values in expression
 *
 * @param {Object} expr The expression given for the projection
 */
function validateExpression(expr: object, options: Options): void {
  let check = [false, false]
  each(expr, (v, k) => {
    if (k === options.config.idKey) return
    if (v === 0 || v === false) {
      check[0] = true
    } else if (v === 1 || v === true) {
      check[1] = true
    }
    assert(!(check[0] && check[1]), 'Projection cannot have a mix of inclusion and exclusion.')
  })
}
