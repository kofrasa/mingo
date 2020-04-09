// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { assert, isArray } from '../../../util'
import { computeValue, Options } from '../../../core'

/**
 * Selects a subset of the array to return an array with only the elements that match the filter condition.
 *
 * @param  {Object} obj  [description]
 * @param  {*} expr [description]
 * @return {*}      [description]
 */
export function $filter(obj: object, expr: any, options: Options): any {
  let input = computeValue(obj, expr.input, null, options)
  let asVar = expr['as']
  let condExpr = expr['cond']

  assert(isArray(input), "$filter 'input' expression must resolve to an array")

  return input.filter((o: any) => {
    // inject variable
    let tempObj = {}
    tempObj['$' + asVar] = o
    return computeValue(tempObj, condExpr, null, options) === true
  })
}
