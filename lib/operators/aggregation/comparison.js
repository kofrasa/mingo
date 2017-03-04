
var comparisonOperators = {
  /**
   * Compares two values and returns the result of the comparison as an integer.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $cmp: function (obj, expr) {
    var args = computeValue(obj, expr, null)
    if (args[0] > args[1]) return 1
    if (args[0] < args[1]) return -1
    return 0
  }
}
// mixin comparison operators
each(['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin'], function (op) {
  comparisonOperators[op] = function (obj, expr) {
    var args = computeValue(obj, expr, null)
    return simpleOperators[op](args[0], args[1])
  }
})
