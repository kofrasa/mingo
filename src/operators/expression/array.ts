// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import {
  assert,
  has,
  into,
  isArray,
  isEqual,
  isObject,
  isBoolean,
  isNil,
  slice,
  truthy
} from '../../util'
import { computeValue } from '../../core'
import { createExpressionOperator, $nin as __nin } from '.././.internal/predicates'

/**
 * Returns a boolean indicating whether a specified value is not an array.
 * Note: This expression operator is missing from the documentation
 *
 * @param {Object} obj
 * @param {Array} expr
 */
export const $nin = createExpressionOperator(__nin)

/**
 * Returns the element at the specified array index.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $arrayElemAt(obj: object, expr: any): any {
  let args = computeValue(obj, expr)
  assert(isArray(args) && args.length === 2, '$arrayElemAt expression must resolve to array(2)')

  if (args.some(isNil)) return null

  let index = args[1]
  let arr = args[0]
  if (index < 0 && Math.abs(index) <= arr.length) {
    return arr[(index + arr.length) % arr.length]
  } else if (index >= 0 && index < arr.length) {
    return arr[index]
  }
  return undefined
}

/**
 * Converts an array of key value pairs to a document.
 */
export function $arrayToObject(obj: object, expr: any): any {
  let arr = computeValue(obj, expr) as any[]
  assert(isArray(arr), '$arrayToObject expression must resolve to an array')

  return arr.reduce((newObj, val) => {
    if (isArray(val) && val.length == 2) {
      newObj[val[0]] = val[1]
    } else {
      assert(isObject(val) && has(val, 'k') && has(val, 'v'), '$arrayToObject expression is invalid.')
      newObj[val.k] = val.v
    }
    return newObj
  }, {})
}

/**
 * Concatenates arrays to return the concatenated array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $concatArrays(obj: object, expr: any): any {
  let arr = computeValue(obj, expr) as any[]
  assert(isArray(arr), '$concatArrays must resolve to an array')

  if (arr.some(isNil)) return null
  return arr.reduce((acc: any[], item: any) => into(acc, item), [])
}

/**
 * Selects a subset of the array to return an array with only the elements that match the filter condition.
 *
 * @param  {Object} obj  [description]
 * @param  {*} expr [description]
 * @return {*}      [description]
 */
export function $filter(obj: object, expr: any): any {
  let input = computeValue(obj, expr.input)
  let asVar = expr['as']
  let condExpr = expr['cond']

  assert(isArray(input), "$filter 'input' expression must resolve to an array")

  return input.filter((o: any) => {
    // inject variable
    let tempObj = {}
    tempObj['$' + asVar] = o
    return computeValue(tempObj, condExpr) === true
  })
}

/**
 * Returns a boolean indicating whether a specified value is in an array.
 *
 * @param {Object} obj
 * @param {Array} expr
 */
export function $in(obj: object, expr: any): any {
  let args = computeValue(obj, expr)
  let item = args[0]
  let arr = args[1]
  assert(isArray(arr), '$in second argument must be an array')
  return arr.some(isEqual.bind(null, item))
}

/**
 * Searches an array for an occurrence of a specified value and returns the array index of the first occurrence.
 * If the substring is not found, returns -1.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $indexOfArray(obj: object, expr: any): any {
  let args = computeValue(obj, expr)
  if (isNil(args)) return null

  let arr = args[0]
  let searchValue = args[1]
  if (isNil(arr)) return null

  assert(isArray(arr), '$indexOfArray expression must resolve to an array.')

  let start = args[2] || 0
  let end = args[3]
  if (isNil(end)) end = arr.length
  if (start > end) return -1

  assert(start >= 0 && end >= 0, '$indexOfArray expression is invalid')

  if (start > 0 || end < arr.length) {
    arr = arr.slice(start, end)
  }
  return arr.findIndex(isEqual.bind(null, searchValue)) + start
}

/**
 * Determines if the operand is an array. Returns a boolean.
 *
 * @param  {Object}  obj
 * @param  {*}  expr
 * @return {Boolean}
 */
export function $isArray(obj: object, expr: any): any {
  return isArray(computeValue(obj, expr[0]))
}

/**
 * Applies a sub-expression to each element of an array and returns the array of resulting values in order.
 *
 * @param obj
 * @param expr
 * @returns {Array|*}
 */
export function $map(obj: object, expr: any): any {
  let inputExpr = computeValue(obj, expr.input)
  assert(isArray(inputExpr), `$map 'input' expression must resolve to an array`)

  let asExpr = expr['as']
  let inExpr = expr['in']

  // HACK: add the "as" expression as a value on the object to take advantage of "resolve()"
  // which will reduce to that value when invoked. The reference to the as expression will be prefixed with "$$".
  // But since a "$" is stripped of before passing the name to "resolve()" we just need to prepend "$" to the key.
  let tempKey = '$' + asExpr
  return inputExpr.map((v: any) => {
    obj[tempKey] = v
    return computeValue(obj, inExpr)
  })
}

/**
 * Returns an array whose elements are a generated sequence of numbers.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $range(obj: object, expr: any): any {
  let arr = computeValue(obj, expr)
  let start = arr[0]
  let end = arr[1]
  let step = arr[2] || 1

  let result = []

  while ((start < end && step > 0) || (start > end && step < 0)) {
    result.push(start)
    start += step
  }

  return result
}

/**
 * Applies an expression to each element in an array and combines them into a single value.
 *
 * @param {Object} obj
 * @param {*} expr
 */
export function $reduce(obj: object, expr: any): any {
  let input = computeValue(obj, expr.input) as any[]
  let initialValue = computeValue(obj, expr.initialValue)
  let inExpr = expr['in']

  if (isNil(input)) return null
  assert(isArray(input), "$reduce 'input' expression must resolve to an array")

  return input.reduce((acc, n) => computeValue({ '$value': acc, '$this': n }, inExpr), initialValue)
}

/**
 * Returns an array with the elements in reverse order.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $reverseArray(obj: object, expr: any): any {
  let arr = computeValue(obj, expr)

  if (isNil(arr)) return null
  assert(isArray(arr), '$reverseArray expression must resolve to an array')

  let result = []
  into(result, arr)
  result.reverse()
  return result
}

/**
 * Counts and returns the total the number of items in an array.
 *
 * @param obj
 * @param expr
 */
export function $size(obj: object, expr: any): any {
  let value = computeValue(obj, expr)
  return isArray(value) ? value.length : undefined
}

/**
 * Returns a subset of an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
export function $slice(obj: object, expr: any): any {
  let arr = computeValue(obj, expr)
  return slice(arr[0], arr[1], arr[2])
}

/**
 * Merge two lists together.
 *
 * Transposes an array of input arrays so that the first element of the output array would be an array containing,
 * the first element of the first input array, the first element of the second input array, etc.
 *
 * @param  {Obj} obj
 * @param  {*} expr
 * @return {*}
 */
export function $zip(obj: object, expr: any): any {
  let inputs = computeValue(obj, expr.inputs)
  let useLongestLength = expr.useLongestLength || false

  assert(isArray(inputs), "'inputs' expression must resolve to an array")
  assert(isBoolean(useLongestLength), "'useLongestLength' must be a boolean")

  if (isArray(expr.defaults)) {
    assert(truthy(useLongestLength), "'useLongestLength' must be set to true to use 'defaults'")
  }

  let zipCount = 0

  for (let i = 0, len = inputs.length; i < len; i++) {
    let arr = inputs[i]

    if (isNil(arr)) return null

    assert(isArray(arr), "'inputs' expression values must resolve to an array or null")

    zipCount = useLongestLength
      ? Math.max(zipCount, arr.length)
      : Math.min(zipCount || arr.length, arr.length)
  }

  let result = []
  let defaults = expr.defaults || []

  for (let i = 0; i < zipCount; i++) {
    let temp = inputs.map((val: any, index: number) => {
      return isNil(val[i]) ? (defaults[index] || null) : val[i]
    })
    result.push(temp)
  }

  return result
}
