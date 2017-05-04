/**
 * Aggregation framework variable operators
 */

var variableOperators = {
  /**
   * Applies a sub-expression to each element of an array and returns the array of resulting values in order.
   *
   * @param obj
   * @param expr
   * @returns {Array|*}
   */
  $map: function (obj, expr) {
    var inputExpr = computeValue(obj, expr['input'], null)
    if (!isArray(inputExpr)) {
      err('Input expression for $map must resolve to an array')
    }
    var asExpr = expr['as']
    var inExpr = expr['in']

    // HACK: add the "as" expression as a value on the object to take advantage of "resolve()"
    // which will reduce to that value when invoked. The reference to the as expression will be prefixed with "$$".
    // But since a "$" is stripped of before passing the name to "resolve()" we just need to prepend "$" to the key.
    var tempKey = '$' + asExpr
    // let's save any value that existed, kinda useless but YOU CAN NEVER BE TOO SURE, CAN YOU :)
    var original = obj[tempKey]
    return inputExpr.map(function (item) {
      obj[tempKey] = item
      var value = computeValue(obj, inExpr, null)
      // cleanup and restore
      if (isUndefined(original)) {
        delete obj[tempKey]
      } else {
        obj[tempKey] = original
      }
      return value
    })
  },

  /**
   * Defines variables for use within the scope of a sub-expression and returns the result of the sub-expression.
   *
   * @param obj
   * @param expr
   * @returns {*}
   */
  $let: function (obj, expr) {
    var varsExpr = expr['vars']
    var inExpr = expr['in']

    // resolve vars
    var originals = {}
    var varsKeys = keys(varsExpr)
    each(varsKeys, function (key) {
      var val = computeValue(obj, varsExpr[key], null)
      var tempKey = '$' + key
      // set value on object using same technique as in "$map"
      originals[tempKey] = obj[tempKey]
      obj[tempKey] = val
    })

    var value = computeValue(obj, inExpr, null)

    // cleanup and restore
    each(varsKeys, function (key) {
      var tempKey = '$' + key
      if (isUndefined(originals[tempKey])) {
        delete obj[tempKey]
      } else {
        obj[tempKey] = originals[tempKey]
      }
    })

    return value
  }
}
