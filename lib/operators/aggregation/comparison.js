import { each } from '../../util.js'
import { computeValue } from '../../internal.js'
import { simpleOperators } from '../query.js'

export const comparisonOperators = {
  /**
   * Compares two values and returns the result of the comparison as an integer.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */
  $cmp (obj, expr) {
    let args = computeValue(obj, expr)
    if (args[0] > args[1]) return 1
    if (args[0] < args[1]) return -1
    return 0
  }
}
// mixin comparison operators
each(['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$nin'], (op) => {
  comparisonOperators[op] = (obj, expr) => {
    let args = computeValue(obj, expr)
    return simpleOperators[op](args[0], args[1])
  }
})
