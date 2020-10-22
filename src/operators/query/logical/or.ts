// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/

import { assert, isArray, Callback } from '../../../util'
import { Query } from '../../../query'
import { Options } from '../../../core'

/**
 * Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export function $or(selector: string, value: any[], options: Options): Callback<boolean> {
  assert(isArray(value), 'Invalid expression. $or expects value to be an Array')

  let queries = value.map(expr => new Query(expr, options))

  return obj => {
    for (let i = 0; i < queries.length; i++) {
      if (queries[i].test(obj)) {
        return true
      }
    }
    return false
  }
}
