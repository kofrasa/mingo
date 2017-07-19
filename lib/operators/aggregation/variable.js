/**
 * Aggregation framework variable operators
 */

import { assert, each, err, map, isString, isNil, isUndefined, isEmpty, isArray, keys } from '../../util.js'
import { computeValue } from '../../internal.js'

export const variableOperators = {
  /**
   * Applies a sub-expression to each element of an array and returns the array of resulting values in order.
   *
   * @param obj
   * @param expr
   * @returns {Array|*}
   */
  $map (obj, expr) {
    let inputExpr = computeValue(obj, expr['input'], null)
    assert(isArray(inputExpr), 'Input expression for $map must resolve to an array')

    let asExpr = expr['as']
    let inExpr = expr['in']

    // HACK: add the "as" expression as a value on the object to take advantage of "resolve()"
    // which will reduce to that value when invoked. The reference to the as expression will be prefixed with "$$".
    // But since a "$" is stripped of before passing the name to "resolve()" we just need to prepend "$" to the key.
    let tempKey = '$' + asExpr
    // let's save any value that existed, kinda useless but YOU CAN NEVER BE TOO SURE, CAN YOU :)
    let original = obj[tempKey]
    return inputExpr.map((item) => {
      obj[tempKey] = item
      let value = computeValue(obj, inExpr, null)
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
  $let (obj, expr) {
    let varsExpr = expr['vars']
    let inExpr = expr['in']

    // resolve vars
    let originals = {}
    let varsKeys = keys(varsExpr)
    each(varsKeys, (key) => {
      let val = computeValue(obj, varsExpr[key], null)
      let tempKey = '$' + key
      // set value on object using same technique as in "$map"
      originals[tempKey] = obj[tempKey]
      obj[tempKey] = val
    })

    let value = computeValue(obj, inExpr, null)

    // cleanup and restore
    each(varsKeys, (key) => {
      let tempKey = '$' + key
      if (isUndefined(originals[tempKey])) {
        delete obj[tempKey]
      } else {
        obj[tempKey] = originals[tempKey]
      }
    })

    return value
  }
}
