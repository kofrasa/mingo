
var conditionalOperators = {

  /**
   * A ternary operator that evaluates one expression,
   * and depending on the result returns the value of one following expressions.
   *
   * @param obj
   * @param expr
   */
  $cond: function (obj, expr) {
    var ifExpr, thenExpr, elseExpr
    if (isArray(expr)) {
      if (expr.length !== 3) {
        err('Invalid arguments for $cond operator')
      }
      ifExpr = expr[0]
      thenExpr = expr[1]
      elseExpr = expr[2]
    } else if (isObject(expr)) {
      ifExpr = expr['if']
      thenExpr = expr['then']
      elseExpr = expr['else']
    }
    var condition = computeValue(obj, ifExpr, null)
    return condition ? computeValue(obj, thenExpr, null) : computeValue(obj, elseExpr, null)
  },

  /**
   * An operator that evaluates a series of case expressions. When it finds an expression which
   * evaluates to true, it returns the resulting expression for that case. If none of the cases
   * evaluate to true, it returns the default expression.
   *
   * @param obj
   * @param expr
   */
  $switch: function (obj, expr) {
    if (!expr.branches) {
      err('Invalid arguments for $switch operator')
    }

    var validBranch = expr.branches.find(function (branch) {
      if (!(branch.case && branch.then)) {
        err('Invalid arguments for $switch operator')
      }
      return computeValue(obj, branch.case, null)
    })

    if (validBranch) {
      return computeValue(obj, validBranch.then, null)
    } else if (!expr.default) {
      err('Invalid arguments for $switch operator')
    } else {
      return computeValue(obj, expr.default, null)
    }
  },

  /**
   * Evaluates an expression and returns the first expression if it evaluates to a non-null value.
   * Otherwise, $ifNull returns the second expression's value.
   *
   * @param obj
   * @param expr
   * @returns {*}
   */
  $ifNull: function (obj, expr) {
    assert(isArray(expr) && expr.length === 2, 'Invalid arguments for $ifNull operator')
    var args = computeValue(obj, expr, null)
    return (args[0] === null || args[0] === undefined) ? args[1] : args[0]
  }
}
