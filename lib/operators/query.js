/**
 * Query and Projection Operators. https://docs.mongodb.com/manual/reference/operator/query/
 */
import {
  T_ARRAY,
  T_BOOL,
  T_BOOLEAN,
  T_DATE,
  T_FUNCTION,
  T_NULL,
  T_NUMBER,
  T_OBJECT,
  T_REGEX,
  T_REGEXP,
  T_STRING,
  T_UNDEFINED
} from '../constants'
import {
  ensureArray,
  assert,
  clone,
  each,
  flatten,
  getType,
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
  isRegExp,
  isString,
  isUndefined,
  keys,
  unwrap,
} from '../util'
import { computeValue, resolve, normalize } from '../internal.js'
import { Query } from '../query.js'

function sameType(a, b) {
  return getType(a) === getType(b)
}

export const simpleOperators = {

  /**
   * Checks that two values are equal.
   *
   * @param a         The lhs operand as resolved from the object by the given selector
   * @param b         The rhs operand provided by the user
   * @returns {*}
   */
  $eq (a, b) {
    // start with simple equality check
    if (isEqual(a, b)) return true

    // https://docs.mongodb.com/manual/tutorial/query-for-null-fields/
    if (isNil(a) && isNil(b)) return true

    // check
    if (isArray(a)) {
      let eq = isEqual.bind(null, b)
      return a.some(eq) || flatten(a, 1).some(eq)
    }

    return false
  },

  /**
   * Matches all values that are not equal to the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $ne (a, b) {
    return !this.$eq(a, b)
  },

  /**
   * Matches any of the values that exist in an array specified in the query.
   *
   * @param a
   * @param b
   * @returns {*}
   */
  $in (a, b) {
    return intersection(ensureArray(a), b).length > 0
  },

  /**
   * Matches values that do not exist in an array specified to the query.
   *
   * @param a
   * @param b
   * @returns {*|boolean}
   */
  $nin (a, b) {
    return isNil(a) || !this.$in(a, b)
  },

  /**
   * Matches values that are less than the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $lt (a, b) {
    return !isUndefined(ensureArray(a).find((x) => sameType(x, b) && x < b))
  },

  /**
   * Matches values that are less than or equal to the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $lte (a, b) {
    return !isUndefined(ensureArray(a).find((x) => sameType(x, b) && x <= b))
  },

  /**
   * Matches values that are greater than the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $gt (a, b) {
    return !isUndefined(ensureArray(a).find((x) => sameType(x, b) && x > b))
  },

  /**
   * Matches values that are greater than or equal to the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $gte (a, b) {
    return !isUndefined(ensureArray(a).find((x) => sameType(x, b) && x >= b))
  },

  /**
   * Performs a modulo operation on the value of a field and selects documents with a specified result.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $mod (a, b) {
    return !isUndefined(ensureArray(a).find((val) => isNumber(val) && isArray(b) && b.length === 2 && (val % b[0]) === b[1]))
  },

  /**
   * Selects documents where values match a specified regular expression.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $regex (a, b) {
    a = ensureArray(a)
    let match = (x) => isString(x) && !!x.match(b)
    return a.some(match) || flatten(a, 1).some(match)
  },

  /**
   * Matches documents that have the specified field.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $exists (a, b) {
    return ((b === false || b === 0) && isNil(a)) || ((b === true || b === 1) && !isNil(a))
  },

  /**
   * Matches arrays that contain all elements specified in the query.
   *
   * @param a
   * @param b
   * @returns boolean
   */
  $all (a, b) {
    let matched = false
    if (isArray(a) && isArray(b)) {
      for (let i = 0, len = b.length; i < len; i++) {
        if (isObject(b[i]) && inArray(keys(b[i]), '$elemMatch')) {
          matched = matched || this.$elemMatch(a, b[i].$elemMatch)
        } else {
          // order of arguments matter
          return intersection(b, a).length === len
        }
      }
    }
    return matched
  },

  /**
   * Selects documents if the array field is a specified size.
   *
   * @param a
   * @param b
   * @returns {*|boolean}
   */
  $size (a, b) {
    return isArray(a) && isNumber(b) && (a.length === b)
  },

  /**
   * Selects documents if element in the array field matches all the specified $elemMatch condition.
   *
   * @param a
   * @param b
   */
  $elemMatch (a, b) {
    if (isArray(a) && !isEmpty(a)) {
      let query = new Query(b)
      for (let i = 0, len = a.length; i < len; i++) {
        if (query.test(a[i])) {
          return true
        }
      }
    }
    return false
  },

  /**
   * Selects documents if a field is of the specified type.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $type (a, b) {
    switch (b) {
      case 1:
      case 'double':
        return isNumber(a) && (a + '').indexOf('.') !== -1
      case 2:
      case T_STRING:
        return isString(a)
      case 3:
      case T_OBJECT:
        return isObject(a)
      case 4:
      case T_ARRAY:
        return isArray(a)
      case 6:
      case T_UNDEFINED:
        return isNil(a)
      case 8:
      case T_BOOL:
        return isBoolean(a)
      case 9:
      case T_DATE:
        return isDate(a)
      case 10:
      case T_NULL:
        return isNull(a)
      case 11:
      case T_REGEX:
        return isRegExp(a)
      case 16:
      case 'int':
        return isNumber(a) && a <= 2147483647 && (a + '').indexOf('.') === -1
      case 18:
      case 'long':
        return isNumber(a) && a > 2147483647 && a <= 9223372036854775807 && (a + '').indexOf('.') === -1
      case 19:
      case 'decimal':
        return isNumber(a)
      default:
        return false
    }
  }
}

export const queryOperators = {

  /**
   * Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
   *
   * @param selector
   * @param value
   * @returns {{test: Function}}
   */
  $and (selector, value) {
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
  },

  /**
   * Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
   *
   * @param selector
   * @param value
   * @returns {{test: Function}}
   */
  $or (selector, value) {
    assert(isArray(value),'Invalid expression. $or expects value to be an Array')

    let queries = []
    each(value, (expr) => queries.push(new Query(expr)))

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
  },

  /**
   * Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
   *
   * @param selector
   * @param value
   * @returns {{test: Function}}
   */
  $nor (selector, value) {
    assert(isArray(value),'Invalid expression. $nor expects value to be an Array')
    let query = this.$or('$or', value)
    return {
      test (obj) {
        return !query.test(obj)
      }
    }
  },

  /**
   * Inverts the effect of a query expression and returns documents that do not match the query expression.
   *
   * @param selector
   * @param value
   * @returns {{test: Function}}
   */
  $not (selector, value) {
    let criteria = {}
    criteria[selector] = normalize(value)
    let query = new Query(criteria)
    return {
      test (obj) {
        return !query.test(obj)
      }
    }
  },

  /**
   * Matches documents that satisfy a JavaScript expression.
   *
   * @param selector
   * @param value
   * @returns {{test: test}}
   */
  $where (selector, value) {
    if (!isFunction(value)) {
      value = new Function('return ' + value + ';')
    }
    return {
      test (obj) {
        return value.call(obj) === true
      }
    }
  },

  /**
   * Allows the use of aggregation expressions within the query language.
   *
   * @param selector
   * @param value
   * @returns {{test: test}}
   */
  $expr (selector, value) {
    return {
      test (obj) {
        return computeValue(obj, value)
      }
    }
  }
}

// add simple query operators
each(simpleOperators, (fn, op) => {
  queryOperators[op] = ((f, ctx) => {
    f = f.bind(ctx)
    return (selector, value) => {
      return {
        test (obj) {
          // value of field must be fully resolved.
          let lhs = resolve(obj, selector, { meta:true })
          lhs = unwrap(lhs.result, lhs.depth)
          return f(lhs, value)
        }
      }
    }
  })(fn, simpleOperators)
})