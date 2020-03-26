/**
 * Query and Projection Operators. https://docs.mongodb.com/manual/reference/operator/query/
 */
import {
  T_ARRAY,
  T_BOOL,
  T_DATE,
  T_NULL,
  T_OBJECT,
  T_REGEX,
  T_STRING,
  T_UNDEFINED,
  MAX_INT,
  MIN_INT,
  MAX_LONG,
  MIN_LONG
} from '../constants'
import {
  ensureArray,
  flatten,
  getType,
  inArray,
  intersection,
  isArray,
  isBoolean,
  isDate,
  isEqual,
  isNil,
  isNull,
  isNumber,
  isObject,
  isOperator,
  isRegExp,
  isString,
  keys,
  Predicate
} from '../util'
import { Query } from '../query'

/**
 * Checks that two values are equal.
 *
 * @param a         The lhs operand as resolved from the object by the given selector
 * @param b         The rhs operand provided by the user
 * @returns {*}
 */
export function $eq(a: any, b: any): boolean {
  // start with simple equality check
  if (isEqual(a, b)) return true

  // https://docs.mongodb.com/manual/tutorial/query-for-null-fields/
  if (isNil(a) && isNil(b)) return true

  // check
  if (a instanceof Array) {
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
export function $ne(a: any, b: any): boolean {
  return !$eq(a, b)
}

/**
 * Matches any of the values that exist in an array specified in the query.
 *
 * @param a
 * @param b
 * @returns {*}
 */
export function $in(a: any, b: any): boolean {
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
export function $nin(a: any, b: any): boolean {
  return !$in(a, b)
}

/**
 * Matches values that are less than the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $lt(a: any, b: any): boolean {
  return compare(a, b, (x: any, y: any) => x < y)
}

/**
 * Matches values that are less than or equal to the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $lte(a: any, b: any): boolean {
  return compare(a, b, (x: any, y: any) => x <= y)
}

/**
 * Matches values that are greater than the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $gt(a: any, b: any): boolean {
  return compare(a, b, (x: any, y: any) => x > y)
}

/**
 * Matches values that are greater than or equal to the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $gte(a: any, b: any): boolean {
  return compare(a, b, (x: any, y: any) => x >= y)
}

/**
 * Performs a modulo operation on the value of a field and selects documents with a specified result.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $mod(a: any, b: number[]): boolean {
  return ensureArray(a).some((x: number) => b.length === 2 && (x % b[0]) === b[1])
}

/**
 * Selects documents where values match a specified regular expression.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
export function $regex(a: any, b: any): boolean {
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
export function $exists(a: any, b: any): boolean {
  return ((b === false || b === 0) && a === undefined) || ((b === true || b === 1) && a !== undefined)
}

/**
 * Matches arrays that contain all elements specified in the query.
 *
 * @param a
 * @param b
 * @returns boolean
 */
export function $all(a: any, b: any): boolean {
  let matched = false
  if (a instanceof Array && b instanceof Array) {
    for (let i = 0, len = b.length; i < len; i++) {
      if (isObject(b[i]) && inArray(keys(b[i]), '$elemMatch')) {
        matched = matched || $elemMatch(a, b[i].$elemMatch)
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
export function $size(a: any[], b: number): boolean {
  return a.length === b
}

/**
 * Selects documents if element in the array field matches all the specified $elemMatch condition.
 *
 * @param a {Array} element to match against
 * @param b {Object} subquery
 */
export function $elemMatch(a: any[], b: object): boolean {
  if (a.length > 0) {
    let format = (x: any) => x
    let criteria = b

    // If we find an operator in the subquery, we fake a field to point to it.
    // This is an attempt to ensure that it a valid criteria.
    if (keys(b).every(isOperator)) {
      criteria = { temp: b }
      format = x => ({ temp: x })
    }
    let query = new Query(criteria)
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
export function $type(a: any, b: number | string): boolean {
  switch (b) {
    case 1:
    case 'double':
      return isNumber(a) && a.toString().indexOf('.') !== -1
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
      return isNumber(a) && a >= MIN_INT && a <= MAX_INT && a.toString().indexOf('.') === -1
    case 18:
    case 'long':
      return isNumber(a) && a >= MIN_LONG && a <= MAX_LONG && a.toString().indexOf('.') === -1
    case 19:
    case 'decimal':
      return isNumber(a)
    default:
      return false
  }
}

function compare(a: any, b: any, f: Predicate<boolean>): boolean {
  return ensureArray(a).some(x => getType(x) === getType(b) && f(x, b))
}