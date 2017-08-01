import { OP_AGGREGATE, OP_GROUP, OP_PIPELINE, OP_PROJECTION, OP_QUERY } from './constants'
import {
  assert,
  each,
  err,
  getType,
  has,
  inArray,
  intersection,
  isArray,
  isBoolean,
  isDate,
  isEmpty,
  isEqual,
  isFunction,
  isNil,
  isNull,
  isNumber,
  isObject,
  isObjectLike,
  isRegExp,
  isString,
  isUndefined,
  notInArray,
  reduce
} from './util'
import { normalize } from './internal.js'
import { Cursor } from './cursor.js'
import { ops } from './operators/index.js'
import { groupOperators } from './operators/group.js'
import { queryOperators } from './operators/query.js'

/**
 * Query object to test collection elements with
 * @param criteria the pass criteria for the query
 * @param projection optional projection specifiers
 * @constructor
 */
export class Query {

  constructor (criteria, projection = {}) {
    this.__criteria = criteria
    this.__projection = projection
    this.__compiled = []
    this._compile()
  }

  _compile () {
    if (isEmpty(this.__criteria)) return

    assert(isObject(this.__criteria), 'Criteria must be of type Object')

    let whereOperator;

    each(this.__criteria, (expr, field) => {
      // save $where operators to be executed after other operators
      if ('$where' === field) {
        whereOperator = { field: field, expr: expr };
      } else if (inArray(['$and', '$or', '$nor'], field)) {
        this._processOperator(field, field, expr)
      } else {
        // normalize expression
        expr = normalize(expr)
        each(expr, (val, op) => {
          this._processOperator(field, op, val)
        })
      }

      if (isObject(whereOperator)) {
        this._processOperator(whereOperator.field, whereOperator.field, whereOperator.expr);
      }
    })
  }

  _processOperator (field, operator, value) {
    if (inArray(ops(OP_QUERY), operator)) {
      this.__compiled.push(queryOperators[operator](field, value))
    } else {
      err("Invalid query operator '" + operator + "' detected")
    }
  }

  /**
   * Checks if the object passes the query criteria. Returns true if so, false otherwise.
   * @param obj
   * @returns {boolean}
   */
  test (obj) {
    for (let i = 0, len = this.__compiled.length; i < len; i++) {
      if (!this.__compiled[i].test(obj)) {
        return false
      }
    }
    return true
  }

  /**
   * Performs a query on a collection and returns a cursor object.
   * @param collection
   * @param projection
   * @returns {Cursor}
   */
  find (collection, projection) {
    return new Cursor(collection, this, projection)
  }

  /**
   * Remove matched documents from the collection returning the remainder
   * @param collection
   * @returns {Array}
   */
  remove (collection) {
    return reduce(collection, (acc, obj) => {
      if (!this.test(obj)) acc.push(obj)
      return acc
    }, [])
  }
}

/**
 * Performs a query on a collection and returns a cursor object.
 *
 * @param collection
 * @param criteria
 * @param projection
 * @returns {Cursor}
 */
export function find (collection, criteria, projection) {
  return new Query(criteria).find(collection, projection)
}

/**
 * Returns a new array without objects which match the criteria
 *
 * @param collection
 * @param criteria
 * @returns {Array}
 */
export function remove (collection, criteria) {
  return new Query(criteria).remove(collection)
}

