// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/

import { assert, isArray, Callback } from '../../../util'
import { Query } from '../../../query'
import { Options } from '../../../core'


/**
 * Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export function $and(selector: string, value: any[], options: Options): Callback<boolean> {
  assert(isArray(value), 'Invalid expression: $and expects value to be an Array')

  let queries = []
  value.forEach(expr => queries.push(new Query(expr, options)))

  return obj => {
    for (let i = 0; i < queries.length; i++) {
      if (!queries[i].test(obj)) {
        return false
      }
    }
    return true
  }
}
