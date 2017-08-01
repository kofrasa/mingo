import { computeValue } from '../../internal'
import { truthy } from '../../util'

export const booleanOperators = {
  /**
   * Returns true only when all its expressions evaluate to true. Accepts any number of argument expressions.
   *
   * @param obj
   * @param expr
   * @returns {boolean}
   */
  $and: (obj, expr) => {
    let value = computeValue(obj, expr)
    return truthy(value) && value.every(truthy)
  },

  /**
   * Returns true when any of its expressions evaluates to true. Accepts any number of argument expressions.
   *
   * @param obj
   * @param expr
   * @returns {boolean}
   */
  $or: (obj, expr) => {
    let value = computeValue(obj, expr)
    return truthy(value) && value.some(truthy)
  },

  /**
   * Returns the boolean value that is the opposite of its argument expression. Accepts a single argument expression.
   *
   * @param obj
   * @param expr
   * @returns {boolean}
   */
  $not: (obj, expr) => {
    return !computeValue(obj, expr[0])
  }
}
