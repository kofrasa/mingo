// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/

import {
  assert,
  isArray,
  normalize,
  Callback,
} from '../../util'
import { Query } from '../../query'
import { Options } from '../../core'


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
  value.forEach(expr => queries.push(new Query(expr, options.config)))

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
export function $or(selector: string, value: any[], options: Options): Callback<boolean> {
  assert(isArray(value), 'Invalid expression. $or expects value to be an Array')

  let queries = value.map(expr => new Query(expr, options.config))

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
export function $nor(selector: string, value: any, options: Options): Callback<boolean> {
  assert(isArray(value), 'Invalid expression. $nor expects value to be an Array')
  let f: Callback<boolean> = $or('$or', value, options)
  return (obj: any) => !f(obj)
}

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
  let query = new Query(criteria, options.config)
  return obj => !query.test(obj)
}