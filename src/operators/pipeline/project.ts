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
import { computeValue, idKey, getOperator, OperatorType } from '../../core'
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
export function $project(collection: Iterator, expr: any, opt?: object): Iterator {
  if (isEmpty(expr)) return collection

  // result collection
  let expressionKeys = keys(expr)
  let idOnlyExcludedExpression = false
  const ID_KEY = idKey()

  // validate inclusion and exclusion
  validateExpression(expr)

  if (inArray(expressionKeys, ID_KEY)) {
    let id = expr[ID_KEY]
    if (id === 0 || id === false) {
      expressionKeys = expressionKeys.filter(notInArray.bind(null, [ID_KEY]))
      assert(notInArray(expressionKeys, ID_KEY), 'Must not contain collections id key')
      idOnlyExcludedExpression = isEmpty(expressionKeys)
    }
  } else {
    // if not specified the add the ID field
    expressionKeys.push(ID_KEY)
  }

  return collection.map(obj => processObject(obj, expr, expressionKeys, idOnlyExcludedExpression))
}

/**
 * Process the expression value for $project operators
 *
 * @param {Object} obj The object to use as context
 * @param {Object} expr The experssion object of $project operator
 * @param {Array} expressionKeys The key in the 'expr' object
 * @param {Boolean} idOnlyExcludedExpression Boolean value indicating whether only the ID key is excluded
 */
function processObject(obj: object, expr: any, expressionKeys: string[], idOnlyExcludedExpression: boolean): object {
  const ID_KEY = idKey()

  let newObj = new Object
  let foundSlice = false
  let foundExclusion = false
  let dropKeys: string[] = []

  if (idOnlyExcludedExpression) {
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
      value = computeValue(obj, subExpr, key)
    } else if (inArray([1, true], subExpr)) {
      // For direct projections, we use the resolved object value
    } else if (subExpr instanceof Array) {
      value = subExpr.map(v => {
        let r = computeValue(obj, v)
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
            value = computeValue(obj, subExpr, key)
          }
        } else {
          value = call(obj, subExpr[operator], key)
        }
      } else if (isOperator(operator)) {
        // compute if operator key
        value = computeValue(obj, subExpr[operator], operator)
      } else if (has(obj, key)) {
        // compute the value for the sub expression for the key
        validateExpression(subExpr)
        let ctx = obj[key]
        if (ctx instanceof Array) {
          value = ctx.map(o => processObject(o, subExpr, subExprKeys, false))
        } else {
          ctx = isObject(ctx) ? ctx : obj
          value = processObject(ctx, subExpr, subExprKeys, false)
        }
      } else {
        // compute the value for the sub expression for the key
        value = computeValue(obj, subExpr)
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

  // if projection included $slice operator
  // Also if exclusion fields are found or we want to exclude only the id field
  // include keys that were not explicitly excluded
  if (foundSlice || foundExclusion || idOnlyExcludedExpression) {
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
function validateExpression(expr: object): void {
  const ID_KEY = idKey()
  let check = [false, false]
  each(expr, (v, k) => {
    if (k === ID_KEY) return
    if (v === 0 || v === false) {
      check[0] = true
    } else if (v === 1 || v === true) {
      check[1] = true
    }
    assert(!(check[0] && check[1]), 'Projection cannot have a mix of inclusion and exclusion.')
  })
}
