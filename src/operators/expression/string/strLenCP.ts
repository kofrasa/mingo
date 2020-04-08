/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { computeValue, Options } from '../../../core'


/**
 * Returns the number of UTF-8 code points in the specified string.
 *
 * @param  {Object} obj
 * @param  {String} expr
 * @return {Number}
 */
export function $strLenCP(obj: object, expr: any, options: Options): any {
  return computeValue(obj, expr, null, options).length
}
