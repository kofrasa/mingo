// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/

import { normalize, Callback } from '../../../util'
import { Query } from '../../../query'
import { Options } from '../../../core'


/**
 * Inverts the effect of a query expression and returns documents that do not match the query expression.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export function $not(selector: string, value: any, options: Options): Callback<boolean> {
  let criteria = {}
  criteria[selector] = normalize(value)
  let query = new Query(criteria, options)
  return obj => !query.test(obj)
}