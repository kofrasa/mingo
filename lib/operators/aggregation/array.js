
var arrayOperators = {
  /**
   * Returns the element at the specified array index.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */
  $arrayElemAt: function (obj, expr) {
    var arr = computeValue(obj, expr, null)
    assert(isArray(arr) && arr.length === 2, '$arrayElemAt expression must resolve to an array of 2 elements')
    assert(isArray(arr[0]), 'First operand to $arrayElemAt must resolve to an array')
    assert(isNumber(arr[1]), 'Second operand to $arrayElemAt must resolve to an integer')
    var idx = arr[1]
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
  $concatArrays: function (obj, expr) {
    var arr = computeValue(obj, expr, null)
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
  $filter: function (obj, expr) {
    var input = computeValue(obj, expr['input'], null)
    var asVar = expr['as']
    var condExpr = expr['cond']

    assert(isArray(input), "'input' expression for $filter must resolve to an array")

    return input.filter(function (o) {
      // inject variable
      var tempObj = {}
      tempObj['$' + asVar] = o
      return computeValue(tempObj, condExpr, null) === true
    })
  },

  /**
   * Searches an array for an occurence of a specified value and returns the array index of the first occurence.
   * If the substring is not found, returns -1.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */
  $indexOfArray: function (obj, expr) {
    var arr = computeValue(obj, expr, null)
    if (isNil(arr)) return null

    var array = arr[0]
    if (isNil(array)) return null

    assert(isArray(array), 'First operand for $indexOfArray must resolve to an array.')

    var searchValue = arr[1]
    if (isNil(searchValue)) return null

    var start = arr[2] || 0
    var end = arr[3] || array.length

    if (end < array.length) {
      array = array.slice(start, end)
    }

    return array.indexOf(searchValue, start)
  },

  /**
   * Determines if the operand is an array. Returns a boolean.
   *
   * @param  {Object}  obj
   * @param  {*}  expr
   * @return {Boolean}
   */
  $isArray: function (obj, expr) {
    return isArray(computeValue(obj, expr, null))
  },

  /**
   * Returns an array whose elements are a generated sequence of numbers.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */
  $range: function (obj, expr) {
    var arr = computeValue(obj, expr, null)
    var start = arr[0]
    var end = arr[1]
    var step = arr[2] || 1

    var result = []

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
  $reverseArray: function (obj, expr) {
    var arr = computeValue(obj, expr, null)

    if (isNil(arr)) return null
    assert(isArray(arr), '$reverseArray expression must resolve to an array')

    var result = []
    for (var i = arr.length - 1; i > -1; i--) {
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
  $reduce: function (obj, expr) {
    var input = computeValue(obj, expr['input'], null)
    var initialValue = computeValue(obj, expr['initialValue'], null)
    var inExpr = expr['in']

    if (isNil(input)) return null
    assert(isArray(input), "'input' expression for $reduce must resolve to an array")

    return input.reduce(function (acc, n) {
      return computeValue({ '$value': acc, '$this': n }, inExpr, null)
    }, initialValue)
  },

  /**
   * Counts and returns the total the number of items in an array.
   *
   * @param obj
   * @param expr
   */
  $size: function (obj, expr) {
    var value = computeValue(obj, expr, null)
    return isArray(value) ? value.length : undefined
  },

  /**
   * Returns a subset of an array.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */
  $slice: function (obj, expr) {
    var arr = computeValue(obj, expr, null)
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
  $zip: function (obj, expr) {
    var inputs = computeValue(obj, expr.inputs, null)
    var useLongestLength = expr.useLongestLength || false

    assert(isArray(inputs), "'inputs' expression must resolve to an array")
    assert(isBoolean(useLongestLength), "'useLongestLength' must be a boolean")

    if (isArray(expr.defaults)) {
      assert(truthy(useLongestLength), "'useLongestLength' must be set to true to use 'defaults'")
    }

    var len = 0
    var arr // temp variable
    var i // loop counter

    for (i = 0; i < inputs.length; i++) {
      arr = inputs[i]

      if (isNil(arr)) return null
      assert(isArray(arr), "'inputs' expression values must resolve to an array or null")

      len = useLongestLength
        ? Math.max(len, arr.length)
        : Math.min(len || arr.length, arr.length)
    }

    var result = []
    var defaults = expr.defaults || []

    for (i = 0; i < len; i++) {
      arr = inputs.map(function (val, index) {
        return isNil(val[i])
          ? (defaults[index] || null)
          : val[i]
      })
      result.push(arr)
    }

    return result
  }
}
