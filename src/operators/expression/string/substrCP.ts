/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { Options } from '../../../core'
import { $substr } from './substr'

export function $substrCP(obj: object, expr: any, options: Options): any {
  return $substr(obj, expr, options)
}
