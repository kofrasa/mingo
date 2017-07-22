import { assert, each, isNumber, isArray, isBoolean, isNil, truthy } from '../../util.js'
import { computeValue, slice } from '../../internal.js'

export const arrayOperators = {
  /**
   * Returns the element at the specified array index.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */
  $arrayElemAt (obj, expr) {
    let arr = computeValue(obj, expr, null)
    assert(isArray(arr) && arr.length === 2, '$arrayElemAt expression must resolve to an array of 2 elements')
    assert(isArray(arr[0]), 'First operand to $arrayElemAt must resolve to an array')
    assert(isNumber(arr[1]), 'Second operand to $arrayElemAt must resolve to an integer')
    let idx = arr[1]
    arr = arr[0]
    if (idx < 0 && Math.abs(idx) <= arr.length) {
      return arr[idx + arr.length]
    } else if (idx >= 0 && idx < arr.length) {
      return arr[idx]
    }
    return undefined
  },

  /**
   * Concatenates arrays to return the concatenated array.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */
  $concatArrays (obj, expr) {
    let arr = computeValue(obj, expr, null)
    assert(isArray(arr) && arr.length === 2, '$concatArrays expression must resolve to an array of 2 elements')

    if (arr.some(isNil)) return null

    return arr[0].concat(arr[1])
  },

  /**
   * Selects a subset of the array to return an array with only the elements that match the filter condition.
   *
   * @param  {Object} obj  [description]
   * @param  {*} expr [description]
   * @return {*}      [description]
   */
  $filter (obj, expr) {
    let input = computeValue(obj, expr['input'], null)
    let asVar = expr['as']
    let condExpr = expr['cond']

    assert(isArray(input), "'input' expression for $filter must resolve to an array")

    return input.filter((o) => {
      // inject variable
      let tempObj = {}
      tempObj['$' + asVar] = o
      return computeValue(tempObj, condExpr, null) === true
    })
  },

  /**
   * Searches an array for an occurrence of a specified value and returns the array index of the first occurence.
   * If the substring is not found, returns -1.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */
  $indexOfArray (obj, expr) {
    let args = computeValue(obj, expr, null)
    if (isNil(args)) return null

    let arr = args[0]
    if (isNil(arr)) return null

    assert(isArray(arr), 'First operand for $indexOfArray must resolve to an array.')

    let searchValue = args[1]
    if (isNil(searchValue)) return null

    let start = args[2] || 0
    let end = args[3] || arr.length

    if (end < arr.length) {
      arr = arr.slice(start, end)
    }

    return arr.indexOf(searchValue, start)
  },

  /**
   * Determines if the operand is an array. Returns a boolean.
   *
   * @param  {Object}  obj
   * @param  {*}  expr
   * @return {Boolean}
   */
  $isArray (obj, expr) {
    return isArray(computeValue(obj, expr, null))
  },

  /**
   * Returns an array whose elements are a generated sequence of numbers.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */
  $range (obj, expr) {
    let arr = computeValue(obj, expr, null)
    let start = arr[0]
    let end = arr[1]
    let step = arr[2] || 1

    let result = []

    while ((start < end && step > 0) || (start > end && step < 0)) {
      result.push(start)
      start += step
    }

    return result
  },

  /**
   * Returns an array with the elements in reverse order.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */
  $reverseArray (obj, expr) {
    let arr = computeValue(obj, expr, null)

    if (isNil(arr)) return null
    assert(isArray(arr), '$reverseArray expression must resolve to an array')

    let result = []
    for (let i = arr.length - 1; i > -1; i--) {
      result.push(arr[i])
    }
    return result
  },

  /**
   * Applies an expression to each element in an array and combines them into a single value.
   *
   * @param {Object} obj
   * @param {*} expr
   */
  $reduce (obj, expr) {
    let input = computeValue(obj, expr['input'], null)
    let initialValue = computeValue(obj, expr['initialValue'], null)
    let inExpr = expr['in']

    if (isNil(input)) return null
    assert(isArray(input), "'input' expression for $reduce must resolve to an array")

    return input.reduce((acc, n) => {
      return computeValue({ '$value': acc, '$this': n }, inExpr, null)
    }, initialValue)
  },

  /**
   * Counts and returns the total the number of items in an array.
   *
   * @param obj
   * @param expr
   */
  $size (obj, expr) {
    let value = computeValue(obj, expr, null)
    return isArray(value) ? value.length : undefined
  },

  /**
   * Returns a subset of an array.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */
  $slice (obj, expr) {
    let arr = computeValue(obj, expr, null)
    return slice(arr[0], arr[1], arr[2])
  },

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
  $zip (obj, expr) {
    let inputs = computeValue(obj, expr.inputs, null)
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
      let temp = inputs.map((val, index) => {
        return isNil(val[i]) ? (defaults[index] || null) : val[i]
      })
      result.push(temp)
    }

    return result
  }
}
