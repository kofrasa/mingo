/**
 * Aggregation framework variable operators
 */

import { assert, each, err, map, isString, isNil, isUndefined, isEmpty, isArray, keys } from '../../util.js'
import { computeValue } from '../../internal.js'

export const variableOperators = {
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
      let val = computeValue(obj, varsExpr[key])
      let tempKey = '$' + key
      // set value on object using same technique as in "$map"
      originals[tempKey] = obj[tempKey]
      obj[tempKey] = val
    })

    let value = computeValue(obj, inExpr)

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
