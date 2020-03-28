// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/

import {
  assert,
  isArray,
  normalize,
  Callback,
} from '../../util'
import { Query } from '../../query'


/**
 * Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export function $and(selector: string, value: any[]): Callback<boolean> {
  assert(isArray(value), 'Invalid expression: $and expects value to be an Array')

  let queries = []
  value.forEach(expr => queries.push(new Query(expr)))

  return obj => {
    for (let i = 0; i < queries.length; i++) {
      if (!queries[i].test(obj)) {
        return false
      }
    }
    return true
  }
}

/**
 * Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export function $or(selector: string, value: any[]): Callback<boolean> {
  assert(isArray(value), 'Invalid expression. $or expects value to be an Array')

  let queries = []
  value.forEach(expr => queries.push(new Query(expr)))

  return obj => {
    for (let i = 0; i < queries.length; i++) {
      if (queries[i].test(obj)) {
        return true
      }
    }
    return false
  }
}

/**
 * Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export function $nor(selector: string, value: any): Callback<boolean> {
  assert(isArray(value), 'Invalid expression. $nor expects value to be an Array')
  let f: Callback<boolean> = $or('$or', value)
  return (obj: any) => !f(obj)
}

/**
 * Inverts the effect of a query expression and returns documents that do not match the query expression.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export function $not(selector: string, value: any): Callback<boolean> {
  let criteria = {}
  criteria[selector] = normalize(value)
  let query = new Query(criteria)
  return obj => !query.test(obj)
}