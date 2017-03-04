
var booleanOperators = {
  /**
   * Returns true only when all its expressions evaluate to true. Accepts any number of argument expressions.
   * @param obj
   * @param expr
   * @returns {boolean}
   */
  $and: function (obj, expr) {
    var value = computeValue(obj, expr, null)
    return truthy(value) && value.every(truthy)
  },

  /**
   * Returns true when any of its expressions evaluates to true. Accepts any number of argument expressions.
   * @param obj
   * @param expr
   * @returns {boolean}
   */
  $or: function (obj, expr) {
    var value = computeValue(obj, expr, null)
    return truthy(value) && value.some(truthy)
  },

  /**
   * Returns the boolean value that is the opposite of its argument expression. Accepts a single argument expression.
   * @param obj
   * @param expr
   * @returns {boolean}
   */
  $not: function (obj, expr) {
    return !computeValue(obj, expr[0], null)
  }
}
