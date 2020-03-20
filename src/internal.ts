import {
  assert,
  each,
  has,
  isArray,
  isNil,
  isObject,
  isObjectLike,
  isString,
  jsType,
  into,
  keys,
  reduce,
  resolve,
  moduleApi
} from './util'
import { OPERATORS } from './operators'
import { T_OBJECT, OP_EXPRESSION, OP_GROUP } from './constants'

interface Settings {
  key: string
}

// internal functions available to external operators
export const _internal = () => Object.assign({ computeValue, ops }, moduleApi())

// Settings used by Mingo internally
const settings = {
  key: '_id'
}

/**
 * Setup default settings for Mingo
 * @param options
 */
export function setup(options: Settings) {
  Object.assign(settings, options)
}

/**
 * Implementation of system variables
 * @type {Object}
 */
const systemVariables = {
  '$$ROOT'(obj, expr, opt) {
    return opt.root
  },
  '$$CURRENT'(obj, expr, opt) {
    return obj
  },
  '$$REMOVE'(obj, expr, opt) {
    return undefined
  }
}

/**
 * Implementation of $redact variables
 *
 * Each function accepts 3 arguments (obj, expr, opt)
 *
 * @type {Object}
 */
const redactVariables = {
  '$$KEEP'(obj: object, expr: object, options?: Options): any {
    return obj
  },
  '$$PRUNE'(obj: object, expr: object, options?: Options): any {
    return undefined
  },
  '$$DESCEND'(obj: object, expr: object, options?: Options): any {
    // traverse nested documents iff there is a $cond
    if (!has(expr, '$cond')) return obj

    let result: any

    each(obj, (current, key) => {
      if (isObjectLike(current)) {
        if (isArray(current)) {
          result = []
          each(current, (elem) => {
            if (isObject(elem)) {
              elem = redactObj(elem, expr, options)
            }
            if (!isNil(elem)) result.push(elem)
          })
        } else {
          result = redactObj(current, expr, options)
        }

        if (isNil(result)) {
          delete obj[key] // pruned result
        } else {
          obj[key] = result
        }
      }
    })
    return obj
  }
}

/**
 * Returns the key used as the collection's objects ids
 */
export function idKey(): string {
  return settings.key
}

/**
 * Returns the operators defined for the given operator classes
 */
export function ops() {
  // Workaround for browser-compatibility bug: on iPhone 6S Safari (and
  // probably some other platforms), `arguments` isn't detected as an array,
  // but has a length field, so functions like `reduce` end up including the
  // length field in their iteration. Copy to a real array.
  let args = Array.prototype.slice.call(arguments)
  return reduce(args, (acc, cls) => into(acc, keys(OPERATORS[cls])), [])
}

/**
 * Returns the result of evaluating a $group operation over a collection
 *
 * @param collection
 * @param field the name of the aggregate operator or field
 * @param expr the expression of the aggregate operator for the field
 * @returns {*}
 */
export function accumulate(collection: any[], field: string, expr: any): any {
  if (has(OPERATORS[OP_GROUP], field)) {
    return OPERATORS[OP_GROUP][field](collection, expr)
  }

  if (isObject(expr)) {
    let result = {}
    each(expr, (val, key) => {
      result[key] = accumulate(collection, key, expr[key])
      // must run ONLY one group operator per expression
      // if so, return result of the computed value
      if (has(OPERATORS[OP_GROUP], key)) {
        result = result[key]
        // if there are more keys in expression this is bad
        assert(keys(expr).length === 1, "Invalid $group expression '" + JSON.stringify(expr) + "'")
        return false // break
      }
    })
    return result
  }
}

interface Options {
  root: object
}

/**
 * Computes the actual value of the expression using the given object as context
 *
 * @param obj the current object from the collection
 * @param expr the expression for the given field
 * @param operator the operator to resolve the field with
 * @param options {Object} extra options
 * @returns {*}
 */
export function computeValue(obj: object, expr: any, operator?: string, options?: Options): any {
  if (options === undefined) {
    options = { root: obj }
  }

  // if the field of the object is a valid operator
  if (has(OPERATORS[OP_EXPRESSION], operator)) {
    return OPERATORS[OP_EXPRESSION][operator](obj, expr, options)
  }

  // we also handle $group accumulator operators
  if (has(OPERATORS[OP_GROUP], operator)) {
    // we first fully resolve the expression
    obj = computeValue(obj, expr, null, options)
    assert(isArray(obj), operator + ' expression must resolve to an array')
    // we pass a null expression because all values have been resolved
    return OPERATORS[OP_GROUP][operator](obj, null, options)
  }

  // if expr is a variable for an object field
  // field not used in this case
  if (isString(expr) && expr.length > 0 && expr[0] === '$') {
    // we return redact variables as literals
    if (has(redactVariables, expr)) {
      return expr
    }

    // handle selectors with explicit prefix
    let arr = expr.split('.')
    if (has(systemVariables, arr[0])) {
      obj = systemVariables[arr[0]](obj, null, options)
      if (arr.length == 1) return obj
      expr = expr.substr(arr[0].length) // '.' prefix will be sliced off below
    }

    return resolve(obj, expr.slice(1))
  }

  // check and return value if already in a resolved state
  if (Array.isArray(expr)) {
    return expr.map(item => computeValue(obj, item))
  } else if (jsType(expr) === T_OBJECT) {
    let result = new Object
    each(expr, (val, key) => {
      result[key] = computeValue(obj, val, key, options)
      // must run ONLY one aggregate operator per expression
      // if so, return result of the computed value
      if ([OP_EXPRESSION, OP_GROUP].some(c => has(OPERATORS[c], key))) {
        // there should be only one operator
        assert(keys(expr).length === 1, "Invalid aggregation expression '" + JSON.stringify(expr) + "'")
        result = result[key]
        return false // break
      }
    })
    return result
  } else {
    return expr
  }
}

/**
 * Redact an object
 * @param  {Object} obj The object to redact
 * @param  {*} expr The redact expression
 * @param  {*} opt  Options for value
 * @return {*} Returns the redacted value
 */
export function redactObj(obj: object, expr: any, options?: Options): object {
  let result = computeValue(obj, expr, null, options)
  return has(redactVariables, result)
    ? redactVariables[result](obj, expr, options)
    : result
}