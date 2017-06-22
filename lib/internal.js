/**
 * Internal functions
 */

// Settings used by Mingo internally
var settings = {
  key: '_id'
}

/**
 * Setup default settings for Mingo
 * @param options
 */
Mingo.setup = function (options) {
  Object.assign(settings, options || {})
}

/**
 * Internally used Mingo helpers.
 * NB: This is not guaranteed to be available in later versions
 */
Mingo._internal = function () {
  return Object.assign(util(), {
    'computeValue': computeValue
  })
}

/**
 * Implementation of system variables
 * @type {Object}
 */
var systemVariables = {
  '$$ROOT': function (obj, expr, opt) {
    return opt.root
  },
  '$$CURRENT': function (obj /*, expr, opt */) {
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
var redactVariables = {
  '$$KEEP': function (obj) {
    return obj
  },
  '$$PRUNE': function () {
    return undefined
  },
  '$$DESCEND': function (obj, expr, opt) {
    // traverse nested documents iff there is a $cond
    if (!has(expr, '$cond')) return obj

    var result

    each(obj, function (current, key) {
      if (isObjectLike(current)) {
        if (isArray(current)) {
          result = []
          each(current, function (elem) {
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
var SYS_VARS = keys(systemVariables)
var REDACT_VARS = keys(redactVariables)

/**
 * Returns the key used as the collection's objects ids
 */
function keyId () {
  return settings.key
}

/**
 * Retrieve the value of a given key on an object
 * @param obj
 * @param field
 * @returns {*}
 * @private
 */
function getValue (obj, field) {
  return obj[field]
}

function hasMeta (obj, value) {
  return has(obj, '__mingo__') && isObject(value) && isEqual(Object.assign({}, obj.__mingo__, value), obj.__mingo__)
}

/**
 * Resolve the value of the field (dot separated) on the given object
 * @param obj {Object} the object context
 * @param selector {String} dot separated path to field
 * @returns {*}
 */
function resolve (obj, selector, deepFlag) {
  var names = selector.split('.')
  var value = obj

  for (var i = 0; i < names.length; i++) {
    var isText = names[i].match(/^\d+$/) === null

    if (isText && isArray(value)) {
      // On the first iteration, we check if we received a stop flag.
      // If so, we stop to prevent iterating over a nested array value
      // on consecutive object keys in the selector.
      if (deepFlag === true && i === 0) {
        return value
      }

      value = value.map(function (item) {
        return resolve(item, names[i], true)
      })

      // we mark this value as being multi-valued
      value.__mingo__ = { isMulti: true }

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
function resolveObj (obj, selector) {
  if (isNil(obj)) return

  var names = selector.split('.')
  var key = names[0]
  // get the next part of the selector
  var next = names.length === 1 || names.slice(1).join('.')
  var isIndex = key.match(/^\d+$/) !== null
  var hasNext = names.length > 1
  var result
  var value

  try {
    if (isArray(obj)) {
      if (isIndex) {
        result = getValue(obj, key)
        if (hasNext) {
          result = resolveObj(result, next)
        }
        assertExists(result)
        result = [result]
      } else {
        result = []
        each(obj, function (item) {
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
      assertExists(value)
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
 * @param  {Function} transformFn Function to execute for value at the end the traversal
 * @param  {Boolean} force Force generating missing parts of object graph
 * @return {*}
 */
function traverse (obj, selector, fn, force) {
  var names = selector.split('.')
  var key = names[0]
  var next = names.length === 1 || names.slice(1).join('.')

  if (names.length === 1) {
    fn(obj, key)
  } else { // nested objects
    if (isArray(obj) && !/^\d+$/.test(key)) {
      each(obj, function (item) {
        traverse(item, selector, fn, force)
      })
    } else {
      // force the rest of the graph while traversing
      if (force === true) {
        var exists = has(obj, key)
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
function setValue (obj, selector, value) {
  traverse(obj, selector, function (item, key) {
    item[key] = value
  }, true)
}

function removeValue (obj, selector) {
  traverse(obj, selector, function (item, key) {
    if (isArray(item) && /^\d+$/.test(key)) {
      item.splice(parseInt(key), 1)
    } else if (isObject(item)) {
      delete item[key]
    }
  })
}


// quick reference for
var primitives = [
  isString, isBoolean, isNumber, isDate, isNil, isRegExp
]

function isPrimitive (value) {
  for (var i = 0; i < primitives.length; i++) {
    if (primitives[i](value)) {
      return true
    }
  }
  return false
}

// primitives and user-defined types
function isSimpleType (value) {
  return isPrimitive(value) || !isObjectLike(value)
}

/**
 * Simplify expression for easy evaluation with query operators map
 * @param expr
 * @returns {*}
 */
function normalize (expr) {
  // normalized primitives
  if (isSimpleType(expr)) {
    return isRegExp(expr) ? { '$regex': expr } : { '$eq': expr }
  }

  // normalize object expression
  if (isObjectLike(expr)) {
    var exprKeys = keys(expr)
    var notQuery = intersection(ops(KEY_QUERY), exprKeys).length === 0

    // no valid query operator found, so we do simple comparison
    if (notQuery) {
      return { '$eq': expr }
    }

    // ensure valid regex
    if (inArray(exprKeys, '$regex')) {
      var regex = expr['$regex']
      var options = expr['$options'] || ''
      var modifiers = ''
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
 * @returns {*}
 */
function computeValue (obj, expr, field, opt) {
  opt = opt || {}
  opt.root = opt.root || obj

  // if the field of the object is a valid operator
  if (inArray(ops(KEY_AGGREGATE), field)) {
    return aggregateOperators[field](obj, expr, opt)
  }

  // we also handle $group accumulator operators
  if (inArray(ops(KEY_GROUP), field)) {
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
    var sysVar = SYS_VARS.filter(function (v) {
      return expr.indexOf(v + '.') === 0
    })

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
  switch (getType(expr)) {
    case 'array':
      return expr.map(function (item) {
        return computeValue(obj, item, null)
      })
    case 'object':
      var result = {}
      for (var key in expr) {
        if (has(expr, key)) {
          result[key] = computeValue(obj, expr[key], key, opt)
          // must run ONLY one aggregate operator per expression
          // if so, return result of the computed value
          if (inArray(ops(KEY_AGGREGATE), key)) {
            // there should be only one operator
            assert(keys(expr).length === 1, "Invalid aggregation expression '" + stringify(expr) + "'")
            result = result[key]
            break
          }
        }
      }
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
function slice (xs, skip, limit) {
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
  return ArrayProto.slice.apply(xs, [skip, limit])
}

/**
 * Compute the standard deviation of the dataset
 * @param  {Object} ctx An object of the context. Includes "dataset:Array" and "sampled:Boolean".
 * @return {Number}
 */
function stddev (ctx) {
  var sum = ctx.dataset.reduce(function (acc, n) {
    return acc + n
  }, 0)
  var N = ctx.dataset.length || 1
  var err = ctx.sampled === true ? 1 : 0
  var avg = sum / (N - err)
  return Math.sqrt(
    ctx.dataset.reduce(function (acc, n) {
      return acc + Math.pow(n - avg, 2)
    }, 0) / N
  )
}

/**
 * Redact an object
 * @param  {Object} obj The object to redact
 * @param  {*} expr The redact expression
 * @param  {*} opt  Options for value
 * @return {*} Returns the redacted value
 */
function redactObj (obj, expr, opt) {
  opt = opt || {}
  opt.root = opt.root || obj

  var result = computeValue(obj, expr, null, opt)
  return inArray(REDACT_VARS, result)
    ? redactVariables[result](obj, expr, opt)
    : result
}
