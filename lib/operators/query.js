// Query and Projection Operators. https://docs.mongodb.com/manual/reference/operator/query/

import {
  assert,
  each,
  isArray,
  isFunction,
  normalize,
  resolve,
  unwrap,
} from '../util'
import { computeValue } from '../internal'
import { Query } from '../query'
import * as predicates from './predicates'


function createQueryOperator(f) {
  return (selector, value) => ({
    test (obj) {
      // value of field must be fully resolved.
      let lhs = resolve(obj, selector, { meta: true })
      lhs = unwrap(lhs.result, lhs.depth)
      return f(lhs, value)
    }
  })
}

export const $all = createQueryOperator(predicates.$all)
export const $elemMatch = createQueryOperator(predicates.$elemMatch)
export const $eq = createQueryOperator(predicates.$eq)
export const $exists = createQueryOperator(predicates.$exists)
export const $gt = createQueryOperator(predicates.$gt)
export const $gte = createQueryOperator(predicates.$gte)
export const $in = createQueryOperator(predicates.$in)
export const $lt = createQueryOperator(predicates.$lt)
export const $lte = createQueryOperator(predicates.$lte)
export const $mod = createQueryOperator(predicates.$mod)
export const $ne = createQueryOperator(predicates.$ne)
export const $nin = createQueryOperator(predicates.$nin)
export const $regex = createQueryOperator(predicates.$regex)
export const $size = createQueryOperator(predicates.$size)
export const $type = createQueryOperator(predicates.$type)

/**
 * Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
 *
 * @param selector
 * @param value
 * @returns {{test: Function}}
 */
export function $and (selector, value) {
  assert(isArray(value), 'Invalid expression: $and expects value to be an Array')

  let queries = []
  each(value, (expr) => queries.push(new Query(expr)))

  return {
    test (obj) {
      for (let i = 0; i < queries.length; i++) {
        if (!queries[i].test(obj)) {
          return false
        }
      }
      return true
    }
  }
}

/**
 * Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
 *
 * @param selector
 * @param value
 * @returns {{test: Function}}
 */
export function $or (selector, value) {
  assert(isArray(value),'Invalid expression. $or expects value to be an Array')

  let queries = []
  each(value, expr => queries.push(new Query(expr)))

  return {
    test (obj) {
      for (let i = 0; i < queries.length; i++) {
        if (queries[i].test(obj)) {
          return true
        }
      }
      return false
    }
  }
}

/**
 * Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
 *
 * @param selector
 * @param value
 * @returns {{test: Function}}
 */
export function $nor (selector, value) {
  assert(isArray(value),'Invalid expression. $nor expects value to be an Array')
  let query = $or('$or', value)
  return {
    test (obj) {
      return !query.test(obj)
    }
  }
}

/**
 * Inverts the effect of a query expression and returns documents that do not match the query expression.
 *
 * @param selector
 * @param value
 * @returns {{test: Function}}
 */
export function $not (selector, value) {
  let criteria = {}
  criteria[selector] = normalize(value)
  let query = new Query(criteria)
  return {
    test (obj) {
      return !query.test(obj)
    }
  }
}

/**
 * Matches documents that satisfy a JavaScript expression.
 *
 * @param selector
 * @param value
 * @returns {{test: test}}
 */
export function $where (selector, value) {
  if (!isFunction(value)) {
    value = new Function('return ' + value + ';')
  }
  return {
    test (obj) {
      return value.call(obj) === true
    }
  }
}

/**
 * Allows the use of aggregation expressions within the query language.
 *
 * @param selector
 * @param value
 * @returns {{test: test}}
 */
export function $expr (selector, value) {
  return {
    test (obj) {
      return computeValue(obj, value)
    }
  }
}