/**
 * Predicates used for Query and Expression operators.
 */

import {
  ensureArray,
  flatten,
  getType,
  inArray,
  intersection,
  isArray,
  isBoolean,
  isDate,
  isEmpty,
  isEqual,
  isNil,
  isNull,
  isNumber,
  isObject,
  isOperator,
  isRegExp,
  isString,
  keys,
  Predicate,
  resolve,
  Callback,
  MAX_INT,
  MIN_INT,
  MAX_LONG,
  MIN_LONG,
  JsType,
  BsonType
} from '../util'
import { Query } from '../query'
import { computeValue, Options } from '../core'

/**
 * Returns a query operator created from the predicate
 *
 * @param pred Predicate function
 */
export function createQueryOperator(pred: Predicate<any>): Callback<any> {
  return (selector: string, value: any, options: Options) => {
    let opts = { unwrapArray: true }
    return (obj: object) => {
      // value of field must be fully resolved.
      let lhs = resolve(obj, selector, opts)
      return pred(lhs, value, options)
    }
  }
}

/**
 * Returns an expression operator created from the predicate
 *
 * @param f Predicate function
 */
export function createExpressionOperator(f: Predicate<any>) {
  return (obj: object, expr: any, options: Options) => {
    let args = computeValue(obj, expr, null, options)
    return f(...args)
  }
}

/**
 * Checks that two values are equal.
 *
 * @param a         The lhs operand as resolved from the object by the given selector
 * @param b         The rhs operand provided by the user
 * @returns {*}
 */
export function $eq(a: any, b: any, options?: Options): boolean {
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
}

/**
 * Matches all values that are not equal to the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $ne(a: any, b: any, options?: Options): boolean {
  return !$eq(a, b, options)
}

/**
 * Matches any of the values that exist in an array specified in the query.
 *
 * @param a
 * @param b
 * @returns {*}
 */
export function $in(a: any, b: any, options?: Options): boolean {
  // queries for null should be able to find undefined fields
  if (isNil(a)) return b.some(isNull)

  return intersection(ensureArray(a), b).length > 0
}

/**
 * Matches values that do not exist in an array specified to the query.
 *
 * @param a
 * @param b
 * @returns {*|boolean}
 */
export function $nin(a: any, b: any, options?: Options): boolean {
  return !$in(a, b, options)
}

/**
 * Matches values that are less than the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $lt(a: any, b: any, options?: Options): boolean {
  return compare(a, b, (x: any, y: any) => x < y)
}

/**
 * Matches values that are less than or equal to the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $lte(a: any, b: any, options?: Options): boolean {
  return compare(a, b, (x: any, y: any) => x <= y)
}

/**
 * Matches values that are greater than the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $gt(a: any, b: any, options?: Options): boolean {
  return compare(a, b, (x: any, y: any) => x > y)
}

/**
 * Matches values that are greater than or equal to the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $gte(a: any, b: any, options?: Options): boolean {
  return compare(a, b, (x: any, y: any) => x >= y)
}

/**
 * Performs a modulo operation on the value of a field and selects documents with a specified result.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $mod(a: any, b: number[], options?: Options): boolean {
  return ensureArray(a).some((x: number) => b.length === 2 && (x % b[0]) === b[1])
}

/**
 * Selects documents where values match a specified regular expression.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $regex(a: any, b: any, options?: Options): boolean {
  a = ensureArray(a)
  let match = ((x: string) => isString(x) && !!x.match(b))
  return a.some(match) || flatten(a, 1).some(match)
}

/**
 * Matches documents that have the specified field.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $exists(a: any, b: any, options?: Options): boolean {
  return ((b === false || b === 0) && a === undefined) || ((b === true || b === 1) && a !== undefined)
}

/**
 * Matches arrays that contain all elements specified in the query.
 *
 * @param a
 * @param b
 * @returns boolean
 */
export function $all(a: any, b: any, options?: Options): boolean {
  let matched = false
  if (isArray(a) && isArray(b)) {
    for (let i = 0, len = b.length; i < len; i++) {
      if (isObject(b[i]) && inArray(keys(b[i]), '$elemMatch')) {
        matched = matched || $elemMatch(a, b[i].$elemMatch, options)
      } else {
        // order of arguments matter
        return intersection(b, a).length === len
      }
    }
  }
  return matched
}

/**
 * Selects documents if the array field is a specified size.
 *
 * @param a
 * @param b
 * @returns {*|boolean}
 */
export function $size(a: any[], b: number, options?: Options): boolean {
  return a.length === b
}

/**
 * Selects documents if element in the array field matches all the specified $elemMatch condition.
 *
 * @param a {Array} element to match against
 * @param b {Object} subquery
 */
export function $elemMatch(a: any[], b: object, options?: Options): boolean {
  // should return false for non-matching input
  if (isArray(a) && !isEmpty(a)) {
    let format = (x: any) => x
    let criteria = b

    // If we find an operator in the subquery, we fake a field to point to it.
    // This is an attempt to ensure that it a valid criteria.
    if (keys(b).every(isOperator)) {
      criteria = { temp: b }
      format = x => ({ temp: x })
    }
    let query = new Query(criteria, options)
    for (let i = 0, len = a.length; i < len; i++) {
      if (query.test(format(a[i]))) {
        return true
      }
    }
  }
  return false
}

/**
 * Selects documents if a field is of the specified type.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $type(a: any, b: number | string, options?: Options): boolean {
  switch (b) {
    case 1:
    case 19:
    case BsonType.DOUBLE:
    case BsonType.DECIMAL:
      return isNumber(a)
    case 2:
    case JsType.STRING:
      return isString(a)
    case 3:
    case JsType.OBJECT:
      return isObject(a)
    case 4:
    case JsType.ARRAY:
      return isArray(a)
    case 6:
    case JsType.UNDEFINED:
      return isNil(a)
    case 8:
    case JsType.BOOLEAN:
    case BsonType.BOOL:
      return isBoolean(a)
    case 9:
    case JsType.DATE:
      return isDate(a)
    case 10:
    case JsType.NULL:
      return isNull(a)
    case 11:
    case JsType.REGEXP:
    case BsonType.REGEX:
      return isRegExp(a)
    case 16:
    case BsonType.INT:
      return isNumber(a) && a >= MIN_INT && a <= MAX_INT && a.toString().indexOf('.') === -1
    case 18:
    case BsonType.LONG:
      return isNumber(a) && a >= MIN_LONG && a <= MAX_LONG && a.toString().indexOf('.') === -1
    default:
      return false
  }
}

function compare(a: any, b: any, f: Predicate<boolean>): boolean {
  return ensureArray(a).some(x => getType(x) === getType(b) && f(x, b))
}