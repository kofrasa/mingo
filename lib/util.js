/**
 * Utility functions
 */

import {
  JS_SIMPLE_TYPES,
  MISSING,
  T_ARRAY,
  T_BOOLEAN,
  T_DATE,
  T_FUNCTION,
  T_NULL,
  T_NUMBER,
  T_OBJECT,
  T_REGEXP,
  T_STRING,
  T_UNDEFINED
} from './constants'

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(valueToFind, fromIndex) {

      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(valueToFind, elementK) is true, return true.
        if (sameValueZero(o[k], valueToFind)) {
          return true;
        }
        // c. Increase k by 1.
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}

const arrayPush = Array.prototype.push

export function assert (condition, message) {
  if (!condition) err(message)
}

/**
 * Deep clone an object
 */
export function cloneDeep (obj) {
  switch (jsType(obj)) {
    case T_ARRAY: return obj.map(cloneDeep)
    case T_OBJECT: return objectMap(obj, cloneDeep)
    default: return obj
  }
}

/**
 * Shallow clone an object
 */
export function clone (obj) {
  switch (jsType(obj)) {
    case T_ARRAY:
      return into([], obj)
    case T_OBJECT:
      return Object.assign({}, obj)
    default:
      return obj
  }
}

export function getType (v) {
  if (v === null) return 'Null'
  if (v === undefined) return 'Undefined'
  return v.constructor.name
}
export function jsType (v) { return getType(v).toLowerCase() }
export function isBoolean (v) { return jsType(v) === T_BOOLEAN }
export function isString (v) { return jsType(v) === T_STRING }
export function isNumber (v) { return jsType(v) === T_NUMBER }
export const isArray = Array.isArray || (v => !!v && v.constructor === Array)
export function isObject(v) { return !!v && v.constructor === Object }
export function isObjectLike (v) { return v === Object(v) } // objects, arrays, functions, date, custom object
export function isDate (v) { return jsType(v) === T_DATE }
export function isRegExp (v) { return jsType(v) === T_REGEXP }
export function isFunction (v) { return jsType(v) === T_FUNCTION }
export function isNil (v) { return v === null || v === undefined }
export function isNull (v) { return v === null }
export function isUndefined (v) { return v === undefined }
export function inArray (arr, item) { return arr.includes(item) }
export function notInArray (arr, item) { return !inArray(arr, item) }
export function truthy (arg) { return !!arg }
export function isEmpty (x) {
  return isNil(x) ||
    isArray(x) && x.length === 0 ||
    isObject(x) && keys(x).length === 0 || !x
}
// ensure a value is an array
export function ensureArray (x) { return isArray(x) ? x : [x] }
export function has (obj, prop) { return obj.hasOwnProperty(prop) }
export function err (s) { throw new Error(s) }
export const keys = Object.keys

// ////////////////// UTILS ////////////////////

/**
 * Iterate over an array or object
 * @param  {Array|Object} obj An object-like value
 * @param  {Function} fn The callback to run per item
 * @param  {*}   ctx  The object to use a context
 * @return {void}
 */
export function each (obj, fn, ctx) {
  fn = fn.bind(ctx)
  if (isArray(obj)) {
    for (let i = 0, len = obj.length; i < len; i++) {
      if (fn(obj[i], i, obj) === false) break
    }
  } else {
    for (let k in obj) {
      if (obj.hasOwnProperty(k)) {
        if (fn(obj[k], k, obj) === false) break
      }
    }
  }
}

/**
 * Transform values in an object
 *
 * @param  {Object}   obj   An object whose values to transform
 * @param  {Function} fn The transform function
 * @param  {*}   ctx The value to use as the "this" context for the transform
 * @return {Array|Object} Result object after applying the transform
 */
export function objectMap (obj, fn, ctx) {
  fn = fn.bind(ctx)
  let o = {}
  let objKeys = keys(obj)
  for (let i = 0; i < objKeys.length; i++) {
    let k = objKeys[i]
    o[k] = fn(obj[k], k)
  }
  return o
}

/**
 * Deep merge objects or arrays.
 * When the inputs have unmergeable types, the source value (right hand side) is returned.
 * If inputs are arrays of same length and all elements are mergable, elements in the same position are merged together.
 * If any of the elements are unmergeable, elements in the source are appended to the target.
 * @param target {Object|Array} the target to merge into
 * @param obj {Object|Array} the source object
 */
export function merge(target, obj, opt = {}) {
  // take care of missing inputs
  if (target === MISSING) return obj
  if (obj === MISSING) return target

  const inputs = [target, obj]

  if (!(inputs.every(isObject) || inputs.every(isArray))) {
    throw Error('mismatched types. must both be array or object')
  }

  // default options
  opt.flatten = opt.flatten || false

  if (isArray(target)) {
    if (opt.flatten) {
      let i = 0
      let j = 0
      while (i < target.length && j < obj.length) {
        target[i] = merge(target[i++], obj[j++], opt)
      }
      while (j < obj.length) {
        target.push(obj[j++])
      }
    } else {
      arrayPush.apply(target, obj)
    }
  } else {
    Object.keys(obj).forEach((k) => {
      if (target.hasOwnProperty(k)) {
        target[k] = merge(target[k], obj[k], opt)
      } else {
        target[k] = obj[k]
      }
    })
  }

  return target
}

/**
 * Reduce any array-like object
 * @param collection
 * @param fn
 * @param accumulator
 * @returns {*}
 */
export function reduce (collection, fn, accumulator) {
  if (isArray(collection)) return collection.reduce(fn, accumulator)
  // array-like objects
  each(collection, (v, k) => accumulator = fn(accumulator, v, k, collection))
  return accumulator
}

/**
 * Returns the intersection between two arrays
 *
 * @param  {Array} xs The first array
 * @param  {Array} ys The second array
 * @return {Array}    Result array
 */
export function intersection (xs, ys) {
  let hashes = ys.map(hashCode)
  return xs.filter(v => inArray(hashes, hashCode(v)))
}

/**
 * Returns the union of two arrays
 *
 * @param  {Array} xs The first array
 * @param  {Array} ys The second array
 * @return {Array}   The result array
 */
export function union (xs, ys) {
  return into(into([], xs), ys.filter(notInArray.bind(null, xs)))
}

/**
 * Flatten the array
 *
 * @param  {Array} xs The array to flatten
 * @param {Number} depth The number of nested lists to iterate
 */
export function flatten (xs, depth = -1) {
  let arr = []
  function flatten2(ys, iter) {
    for (let i = 0, len = ys.length; i < len; i++) {
      if (isArray(ys[i]) && (iter > 0 || iter < 0)) {
        flatten2(ys[i], Math.max(-1, iter - 1))
      } else {
        arr.push(ys[i])
      }
    }
  }
  flatten2(xs, depth)
  return arr
}

/**
 * Unwrap a single element array to specified depth
 * @param {Array} arr
 * @param {Number} depth
 */
export function unwrap(arr, depth) {
  if (depth < 1) return arr
  while (depth-- && isArray(arr) && arr.length === 1) arr = arr[0]
  return arr
}

/**
 * Determine whether two values are the same or strictly equivalent
 *
 * @param  {*}  a The first value
 * @param  {*}  b The second value
 * @return {Boolean}   Result of comparison
 */
export function isEqual (a, b) {

  let lhs = [a]
  let rhs = [b]

  while (lhs.length > 0) {

    a = lhs.pop()
    b = rhs.pop()

    // strictly equal must be equal.
    if (a === b) continue

    // unequal types and functions cannot be equal.
    let type = jsType(a)
    if (type !== jsType(b) || type === T_FUNCTION) return false

    // leverage toString for Date and RegExp types
    switch (type) {
      case T_ARRAY:
        if (a.length !== b.length) return false
        //if (a.length === b.length && a.length === 0) continue
        into(lhs, a)
        into(rhs, b)
        break
      case T_OBJECT:
        // deep compare objects
        let ka = keys(a)
        let kb = keys(b)

        // check length of keys early
        if (ka.length !== kb.length) return false

        // we know keys are strings so we sort before comparing
        ka.sort()
        kb.sort()

        // compare keys
        for (let i = 0, len = ka.length; i < len; i++) {
          let temp = ka[i]
          if (temp !== kb[i]) {
            return false
          } else {
            // save later work
            lhs.push(a[temp])
            rhs.push(b[temp])
          }
        }
        break
      default:
        // compare encoded values
        if (encode(a) !== encode(b)) return false
    }
  }
  return lhs.length === 0
}

/**
 * Return a new unique version of the collection
 * @param  {Array} xs The input collection
 * @return {Array}    A new collection with unique values
 */
export function unique (xs) {
  let h = {}
  let arr = []
  each(xs, (item) => {
    let k = hashCode(item)
    if (!has(h, k)) {
      arr.push(item)
      h[k] = 0
    }
  })
  return arr
}

/**
 * Encode value to string using a simple non-colliding stable scheme.
 *
 * @param value
 * @returns {*}
 */
export function encode (value) {
  let type = jsType(value)
  switch (type) {
    case T_BOOLEAN:
    case T_NUMBER:
    case T_REGEXP:
      return value.toString()
    case T_STRING:
      return JSON.stringify(value)
    case T_DATE:
      return value.toISOString()
    case T_NULL:
    case T_UNDEFINED:
      return type
    case T_ARRAY:
      return '[' + value.map(encode) + ']'
    default:
      let prefix = (type === T_OBJECT)? '' : `${getType(value)}`
      let objKeys = keys(value)
      objKeys.sort()
      return `${prefix}{` + objKeys.map(k => `${encode(k)}:${encode(value[k])}`) + '}'
  }
}

/**
 * Generate hash code
 * This selected function is the result of benchmarking various hash functions.
 * This version performs well and can hash 10^6 documents in ~3s with on average 100 collisions.
 *
 * @param value
 * @returns {*}
 */
export function hashCode (value) {
  if (isNil(value)) return null

  let hash = 0
  let s = encode(value)
  let i = s.length
  while (i) hash = ((hash << 5) - hash) ^ s.charCodeAt(--i)
  return hash >>> 0
}

/**
 * Default compare function
 * @param {*} a
 * @param {*} b
 */
export function compare (a, b) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/**
 * Returns a (stably) sorted copy of list, ranked in ascending order by the results of running each value through iteratee
 *
 * This implementation treats null/undefined sort keys as less than every other type
 *
 * @param {Array}   collection
 * @param {Function} fn The function used to resolve sort keys
 * @param {Function} cmp The comparator function to use for comparing values
 * @return {Array} Returns a new sorted array by the given iteratee
 */
export function sortBy (collection, fn, cmp) {
  let sorted = []
  let result = []
  let hash = {}
  cmp = cmp || compare

  if (isEmpty(collection)) return collection

  for (let i = 0; i < collection.length; i++) {
    let obj = collection[i]
    let key = fn(obj, i)

    // objects with nil keys will go in first
    if (isNil(key)) {
      result.push(obj)
    } else {
      if (hash[key]) {
        hash[key].push(obj)
      } else {
        hash[key] = [obj]
      }
      sorted.push(key)
    }
  }

  // use native array sorting but enforce stableness
  sorted.sort(cmp)

  for (let i = 0; i < sorted.length; i++) {
    into(result, hash[sorted[i]])
  }

  return result
}

/**
 * Groups the collection into sets by the returned key
 *
 * @param collection
 * @param fn {Function} to compute the group key of an item in the collection
 * @returns {{keys: Array, groups: Array}}
 */
export function groupBy (collection, fn) {
  let result = {
    'keys': [],
    'groups': []
  }
  let lookup = {}
  each(collection, obj => {
    let key = fn(obj)
    let hash = hashCode(key)
    let index = -1

    if (lookup[hash] === undefined) {
      index = result.keys.length
      lookup[hash] = index
      result.keys.push(key)
      result.groups.push([])
    }
    index = lookup[hash]
    result.groups[index].push(obj)
  })
  return result
}

/**
 * Push elements in given array into target array
 *
 * @param {*} target The array to push into
 * @param {*} xs The array of elements to push
 */
export function into (target, xs) {
  arrayPush.apply(target, xs)
  return target
}

/**
 * Find the insert index for the given key in a sorted array.
 *
 * @param {*} array The sorted array to search
 * @param {*} item The search key
 */
export function findInsertIndex (array, item) {
  // uses binary search
  let lo = 0
  let hi = array.length - 1
  while (lo <= hi) {
    let mid = Math.round(lo + (hi - lo) / 2)
    if (item < array[mid]) {
      hi = mid - 1
    } else if (item > array[mid]) {
      lo = mid + 1
    } else {
      return mid
    }
  }
  return lo
}

/**
 * This is a generic memoization function
 *
 * This implementation uses a cache independent of the function being memoized
 * to allow old values to be garbage collected when the memoized function goes out of scope.
 *
 * @param {*} fn The function object to memoize
 */
export function memoize (fn) {
  return ((cache) => {
    return (...args) => {
      let key = hashCode(args)
      if (!has(cache, key)) {
        cache[key] = fn.apply(this, args)
      }
      return cache[key]
    }
  })({/* storage */})
}

// mingo internal

/**
 * Retrieve the value of a given key on an object
 * @param obj
 * @param field
 * @returns {*}
 * @private
 */
export function getValue (obj, field) {
  return isObjectLike(obj) ? obj[field] : undefined
}

/**
 * Resolve the value of the field (dot separated) on the given object
 * @param obj {Object} the object context
 * @param selector {String} dot separated path to field
 * @returns {*}
 */
export function resolve (obj, selector, opt = {}) {
  let depth = 0

  // options
  opt.meta = opt.meta || false

  function resolve2(o, path) {
    let value = o
    for (let i = 0; i < path.length; i++) {
      let field = path[i]
      let isText = field.match(/^\d+$/) === null

      if (isText && isArray(value)) {
        // On the first iteration, we check if we received a stop flag.
        // If so, we stop to prevent iterating over a nested array value
        // on consecutive object keys in the selector.
        if (i === 0 && depth > 0) break

        depth += 1
        path = path.slice(i)

        value = reduce(value, (acc, item) => {
          let v = resolve2(item, path)
          if (v !== undefined) acc.push(v)
          return acc
        }, [])
        break
      } else {
        value = getValue(value, field)
      }
      if (value === undefined) break
    }
    return value
  }

  obj = inArray(JS_SIMPLE_TYPES, jsType(obj)) ? obj : resolve2(obj, selector.split('.'))
  return opt.meta
    ? { result: obj, depth: depth }
    : obj
}

/**
 * Returns the full object to the resolved value given by the selector.
 * This function excludes empty values as they aren't practically useful.
 *
 * @param obj {Object} the object context
 * @param selector {String} dot separated path to field
 */
export function resolveObj (obj, selector, opt = {}) {
  // options
  opt.preserveMissingValues = opt.preserveMissingValues || false

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
        result = getValue(obj, Number(key))
        if (hasNext) {
          result = resolveObj(result, next, opt)
        }
        result = [result]
      } else {
        result = []
        each(obj, item => {
          value = resolveObj(item, selector, opt)
          if (opt.preserveMissingValues) {
            if (value === undefined) {
              value = MISSING
            }
            result.push(value)
          } else if (value !== undefined) {
            result.push(value)
          }
        })
      }
    } else {
      value = getValue(obj, key)
      if (hasNext) {
        value = resolveObj(value, next, opt)
      }
      assert(value !== undefined)
      result = {}
      result[key] = value
    }
  } catch (e) {
    result = undefined
  }

  return result
}

/**
 * Filter out all MISSING values from the object in-place
 * @param {*} obj The object the filter
 */
export function filterMissing(obj) {
  if (isArray(obj)) {
    for (let i = obj.length - 1; i >= 0; i--) {
      if (obj[i] === MISSING) {
        obj.splice(i,1)
      } else {
        filterMissing(obj[i])
      }
    }
  } else if (isObject(obj)) {
    for (let k in obj) {
      if (obj.hasOwnProperty(k)) {
        filterMissing(obj[k])
      }
    }
  }
  return obj
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
  } else {
    // force the rest of the graph while traversing
    if (force === true && isNil(obj[key])) {
      obj[key] = {}
    }
    traverse(obj[key], next, fn, force)
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
 * Check whether the given name is an operator. We assume any field name starting with '$' is an operator.
 * This is cheap and safe to do since keys beginning with '$' should be reserved for internal use.
 * @param {String} name
 */
export function isOperator(name) {
  return !!name && name[0] === '$'
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

    // no valid query operator found, so we do simple comparison
    if (!exprKeys.some(isOperator)) {
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
  return xs.slice(skip, limit)
}

/**
 * Compute the standard deviation of the data set
 * @param  {Object} ctx An object of the context. Includes "data:Array" and "sampled:Boolean".
 * @return {Number}
 */
export function stddev (ctx) {
  let sum = reduce(ctx.data, (acc, n) => acc + n, 0)
  let N = ctx.data.length || 1
  let correction = (ctx.sampled && 1) || 0
  let avg = sum / N
  return Math.sqrt(reduce(ctx.data, (acc, n) => acc + Math.pow(n - avg, 2), 0) / (N - correction))
}

/**
 * Exported to the users to allow writing custom operators
 */
export function moduleApi () {
  return {
    assert,
    clone,
    cloneDeep,
    each,
    err,
    hashCode,
    getType,
    has,
    includes: inArray.bind(null),
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
    reduce,
    resolve,
    resolveObj
  }
}