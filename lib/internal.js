import {
  assert,
  each,
  has,
  inArray,
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
import { groupOperators } from './operators/group/index'
import { expressionOperators } from './operators/expression/index'
import { OPERATORS } from './operators/index'
import { T_ARRAY, T_OBJECT, OP_EXPRESSION, OP_GROUP } from './constants'


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
export function setup (options) {
  Object.assign(settings, options || {})
}

/**
 * Implementation of system variables
 * @type {Object}
 */
export const systemVariables = {
  '$$ROOT' (obj, expr, opt) {
    return opt.root
  },
  '$$CURRENT' (obj, expr, opt) {
    return obj
  },
  '$$REMOVE' (obj, expr, opt) {
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
export const redactVariables = {
  '$$KEEP' (obj) {
    return obj
  },
  '$$PRUNE' () {
    return undefined
  },
  '$$DESCEND' (obj, expr, opt) {
    // traverse nested documents iff there is a $cond
    if (!has(expr, '$cond')) return obj

    let result

    each(obj, (current, key) => {
      if (isObjectLike(current)) {
        if (isArray(current)) {
          result = []
          each(current, (elem) => {
            if (isObject(elem)) {
              elem = redactObj(elem, expr, opt)
            }
            if (!isNil(elem)) result.push(elem)
          })
        } else {
          result = redactObj(current, expr, opt)
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

// system variables
export const SYS_VARS = keys(systemVariables)
export const REDACT_VARS = keys(redactVariables)

/**
 * Returns the key used as the collection's objects ids
 */
export function idKey () {
  return settings.key
}

/**
 * Returns the operators defined for the given operator classes
 */
export function ops () {
  // Workaround for browser-compatibility bug: on iPhone 6S Safari (and
  // probably some other platforms), `arguments` isn't detected as an array,
  // but has a length field, so functions like `reduce` and up including the
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
export function accumulate (collection, field, expr) {
  if (inArray(ops(OP_GROUP), field)) {
    return groupOperators[field](collection, expr)
  }

  if (isObject(expr)) {
    let result = {}
    each(expr, (val, key) => {
      result[key] = accumulate(collection, key, expr[key])
      // must run ONLY one group operator per expression
      // if so, return result of the computed value
      if (inArray(ops(OP_GROUP), key)) {
        result = result[key]
        // if there are more keys in expression this is bad
        assert(keys(expr).length === 1, "Invalid $group expression '" + JSON.stringify(expr) + "'")
        return false // break
      }
    })
    return result
  }
}

/**
 * Computes the actual value of the expression using the given object as context
 *
 * @param obj the current object from the collection
 * @param expr the expression for the given field
 * @param operator the operator to resolve the field with
 * @param opt {Object} extra options
 * @returns {*}
 */
export function computeValue (obj, expr, operator = null, opt = {}) {
  opt.root = opt.root || obj

  // if the field of the object is a valid operator
  if (inArray(ops(OP_EXPRESSION), operator)) {
    return expressionOperators[operator](obj, expr, opt)
  }

  // we also handle $group accumulator operators
  if (inArray(ops(OP_GROUP), operator)) {
    // we first fully resolve the expression
    obj = computeValue(obj, expr, null, opt)
    assert(isArray(obj), operator + ' expression must resolve to an array')
    // we pass a null expression because all values have been resolved
    return groupOperators[operator](obj, null, opt)
  }

  // if expr is a variable for an object field
  // field not used in this case
  if (isString(expr) && expr.length > 0 && expr[0] === '$') {
    // we return system variables as literals
    if (inArray(SYS_VARS, expr)) {
      return systemVariables[expr](obj, null, opt)
    } else if (inArray(REDACT_VARS, expr)) {
      return expr
    }

    // handle selectors with explicit prefix
    let sysVar = SYS_VARS.filter((v) => expr.indexOf(v + '.') === 0)

    if (sysVar.length === 1) {
      sysVar = sysVar[0]
      if (sysVar === '$$ROOT') {
        obj = opt.root
      }
      expr = expr.substr(sysVar.length) // '.' prefix will be sliced off below
    }

    return resolve(obj, expr.slice(1))
  }

  // check and return value if already in a resolved state
  switch (jsType(expr)) {
    case T_ARRAY:
      return expr.map(item => computeValue(obj, item))
    case T_OBJECT:
      let result = {}
      each(expr, (val, key) => {
        result[key] = computeValue(obj, val, key, opt)
        // must run ONLY one aggregate operator per expression
        // if so, return result of the computed value
        if (inArray(ops(OP_EXPRESSION, OP_GROUP), key)) {
          // there should be only one operator
          assert(keys(expr).length === 1, "Invalid aggregation expression '" + JSON.stringify(expr) + "'")
          result = result[key]
          return false // break
        }
      })
      return result
    default:
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
export function redactObj (obj, expr, opt = {}) {
  opt.root = opt.root || obj

  let result = computeValue(obj, expr, null, opt)
  return inArray(REDACT_VARS, result)
    ? redactVariables[result](obj, expr, opt)
    : result
}