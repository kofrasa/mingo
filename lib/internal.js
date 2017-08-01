import {
  T_ARRAY,
  T_OBJECT,
  JS_SIMPLE_TYPES,
  OP_AGGREGATE, OP_GROUP, OP_PIPELINE, OP_PROJECTION, OP_QUERY
} from './constants'
import {
  addMeta,
  assert,
  clone,
  dropMeta,
  each,
  err,
  getHash,
  getType,
  has,
  hasMeta,
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
  jsType,
  keys,
  map,
  notInArray,
  reduce,
  truthy
} from './util'
import { groupOperators } from './operators/group.js'
import { ops } from './operators/index.js'
import { aggregateOperators } from './operators/aggregation/index.js'


/**
 * Internal functions
 */

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
 * Retrieve the value of a given key on an object
 * @param obj
 * @param field
 * @returns {*}
 * @private
 */
export function getValue (obj, field) {
  return obj[field]
}

/**
 * Resolve the value of the field (dot separated) on the given object
 * @param obj {Object} the object context
 * @param selector {String} dot separated path to field
 * @param deepFlag {Boolean} flag whether to iterate deeply (default: false)
 * @returns {*}
 */
export function resolve (obj, selector, deepFlag = false) {
  let names = selector.split('.')
  let value = obj

  for (let i = 0; i < names.length; i++) {
    let isText = names[i].match(/^\d+$/) === null

    if (isText && isArray(value)) {
      // On the first iteration, we check if we received a stop flag.
      // If so, we stop to prevent iterating over a nested array value
      // on consecutive object keys in the selector.
      if (deepFlag === true && i === 0) {
        return value
      }

      value = value.map((item) => resolve(item, names[i], true))

      // we mark this value as being multi-valued
      addMeta(value, { isMulti: true })

      // we unwrap for arrays of unit length
      // this avoids excess wrapping when resolving deeply nested arrays
      if (value.length === 1) {
        value = value[0]
      }
    } else {
      value = getValue(value, names[i])
      deepFlag = false // reset stop flag when we do a direct lookup
    }

    if (isNil(value)) break
  }

  return value
}

/**
 * Returns the full object to the resolved value given by the selector.
 * This function excludes empty values as they aren't practically useful.
 *
 * @param obj {Object} the object context
 * @param selector {String} dot separated path to field
 */
export function resolveObj (obj, selector) {
  if (isNil(obj)) return

  let names = selector.split('.')
  let key = names[0]
  // get the next part of the selector
  let next = names.length === 1 || names.slice(1).join('.')
  let isIndex = key.match(/^\d+$/) !== null
  let hasNext = names.length > 1
  let result
  let value

  try {
    if (isArray(obj)) {
      if (isIndex) {
        result = getValue(obj, key)
        if (hasNext) {
          result = resolveObj(result, next)
        }
        assert(!isUndefined(result))
        result = [result]
      } else {
        result = []
        each(obj, (item) => {
          value = resolveObj(item, selector)
          if (!isNil(value)) result.push(value)
        })
        assert(result.length > 0)
      }
    } else {
      value = getValue(obj, key)
      if (hasNext) {
        value = resolveObj(value, next)
      }
      assert(!isUndefined(value))
      result = {}
      result[key] = value
    }
  } catch (e) {
    result = undefined
  }

  return result
}

/**
 * Walk the object graph and execute the given transform function
 * @param  {Object|Array} obj   The object to traverse
 * @param  {String} selector    The selector
 * @param  {Function} fn Function to execute for value at the end the traversal
 * @param  {Boolean} force Force generating missing parts of object graph
 * @return {*}
 */
export function traverse (obj, selector, fn, force = false) {
  let names = selector.split('.')
  let key = names[0]
  let next = names.length === 1 || names.slice(1).join('.')

  if (names.length === 1) {
    fn(obj, key)
  } else { // nested objects
    if (isArray(obj) && !/^\d+$/.test(key)) {
      each(obj, (item) => {
        traverse(item, selector, fn, force)
      })
    } else {
      // force the rest of the graph while traversing
      if (force === true) {
        let exists = has(obj, key)
        if (!exists || isNil(obj[key])) {
          obj[key] = {}
        }
      }
      traverse(obj[key], next, fn, force)
    }
  }
}

/**
 * Set the value of the given object field
 *
 * @param obj {Object|Array} the object context
 * @param selector {String} path to field
 * @param value {*} the value to set
 */
export function setValue (obj, selector, value) {
  traverse(obj, selector, (item, key) => {
    item[key] = value
  }, true)
}

export function removeValue (obj, selector) {
  traverse(obj, selector, (item, key) => {
    if (isArray(item) && /^\d+$/.test(key)) {
      item.splice(parseInt(key), 1)
    } else if (isObject(item)) {
      delete item[key]
    }
  })
}

/**
 * Simplify expression for easy evaluation with query operators map
 * @param expr
 * @returns {*}
 */
export function normalize (expr) {
  // normalized primitives
  if (inArray(JS_SIMPLE_TYPES, jsType(expr))) {
    return isRegExp(expr) ? { '$regex': expr } : { '$eq': expr }
  }

  // normalize object expression
  if (isObjectLike(expr)) {
    let exprKeys = keys(expr)
    let noQuery = intersection(ops(OP_QUERY), exprKeys).length === 0

    // no valid query operator found, so we do simple comparison
    if (noQuery) {
      return { '$eq': expr }
    }

    // ensure valid regex
    if (inArray(exprKeys, '$regex')) {
      let regex = expr['$regex']
      let options = expr['$options'] || ''
      let modifiers = ''
      if (isString(regex)) {
        modifiers += (regex.ignoreCase || options.indexOf('i') >= 0) ? 'i' : ''
        modifiers += (regex.multiline || options.indexOf('m') >= 0) ? 'm' : ''
        modifiers += (regex.global || options.indexOf('g') >= 0) ? 'g' : ''
        regex = new RegExp(regex, modifiers)
      }
      expr['$regex'] = regex
      delete expr['$options']
    }
  }

  return expr
}

/**
 * Computes the actual value of the expression using the given object as context
 *
 * @param obj the current object from the collection
 * @param expr the expression for the given field
 * @param field the field name (may also be an aggregate operator)
 * @param opt {Object} extra options
 * @returns {*}
 */
export function computeValue (obj, expr, field = null, opt = {}) {
  opt.root = opt.root || obj

  // if the field of the object is a valid operator
  if (inArray(ops(OP_AGGREGATE), field)) {
    return aggregateOperators[field](obj, expr, opt)
  }

  // we also handle $group accumulator operators
  if (inArray(ops(OP_GROUP), field)) {
    // we first fully resolve the expression
    obj = computeValue(obj, expr, null, opt)
    assert(isArray(obj), field + ' expression must resolve to an array')
    // we pass a null expression because all values have been resolved
    return groupOperators[field](obj, null, opt)
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
      return expr.map((item) => computeValue(obj, item))
    case T_OBJECT:
      let result = {}
      each(expr, (val, key) => {
        result[key] = computeValue(obj, val, key, opt)
        // must run ONLY one aggregate operator per expression
        // if so, return result of the computed value
        if (inArray(ops(OP_AGGREGATE, OP_GROUP), key)) {
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
 * Returns a slice of the array
 *
 * @param  {Array} xs
 * @param  {Number} skip
 * @param  {Number} limit
 * @return {Array}
 */
export function slice (xs, skip, limit = null) {
  // MongoDB $slice works a bit differently from Array.slice
  // Uses single argument for 'limit' and array argument [skip, limit]
  if (isNil(limit)) {
    if (skip < 0) {
      skip = Math.max(0, xs.length + skip)
      limit = xs.length - skip + 1
    } else {
      limit = skip
      skip = 0
    }
  } else {
    if (skip < 0) {
      skip = Math.max(0, xs.length + skip)
    }
    assert(limit > 0, 'Invalid argument value for $slice operator. Limit must be a positive number')
    limit += skip
  }
  return Array.prototype.slice.apply(xs, [skip, limit])
}

/**
 * Compute the standard deviation of the data set
 * @param  {Object} ctx An object of the context. Includes "data:Array" and "sampled:Boolean".
 * @return {Number}
 */
export function stddev (ctx) {
  let sum = reduce(ctx.data, (acc, n) => acc + n, 0)
  let N = ctx.data.length || 1
  let correction = ctx.sampled === true ? 1 : 0
  let avg = sum / (N - correction)
  return Math.sqrt(reduce(ctx.data, (acc, n) => acc + Math.pow(n - avg, 2), 0) / N)
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

/**
 * Exported to the users to allow writing custom operators
 */
export function _internal () {
  return {
    computeValue,
    idKey,
    ops,
    resolve,
    assert,
    clone,
    each,
    err,
    getType,
    has,
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
    map
  }
}