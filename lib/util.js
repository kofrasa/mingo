/**
 * Utility functions
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
} from './constants'

export function assert (condition, message) {
  if (falsey(condition)) err(message)
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
export const isArray = Array.isArray || (v => jsType(v) === T_ARRAY)
// export function isArrayLike (v) { return !isNil(v) && has(v, 'length') }
export function isObject (v) { return jsType(v) === T_OBJECT }
export function isObjectLike (v) { return v === Object(v) } // objects, arrays, functions, date, custom object
export function isDate (v) { return jsType(v) === T_DATE }
export function isRegExp (v) { return jsType(v) === T_REGEXP }
export function isFunction (v) { return jsType(v) === T_FUNCTION }
export function isNil (v) { return isNull(v) || isUndefined(v) }
export function isNull (v) { return jsType(v) === T_NULL }
export function isUndefined (v) { return jsType(v) === T_UNDEFINED }
export function inArray (arr, item) { return arr.some(isEqual.bind(null, item)) }
export function notInArray (arr, item) { return !inArray(arr, item) }
export function truthy (arg) { return !!arg }
export function falsey (arg) { return !arg }
export function isEmpty (x) {
  return isNil(x) ||
    isArray(x) && x.length === 0 ||
    isObject(x) && keys(x).length === 0 || !x
}
// ensure a value is an array
export function ensureArray (x) { return isArray(x) ? x : [x] }
export function has (obj, prop) { return obj.hasOwnProperty(prop) }
export function err (s) { throw new Error(s) }
export function keys (o) { return Object.keys(o) }

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
      if (has(obj, k)) {
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
  each(obj, (v, k) => {
    o[k] = fn(v, k)
  }, obj)
  return o
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
  return xs.filter(inArray.bind(null, ys))
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
  assert(isArray(xs), 'Input must be an Array')
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
    let k = getHash(item)
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
export function getHash (value) {
  let hash = 0
  let s = encode(value)
  let i = s.length
  while (i) hash = ((hash << 5) - hash) ^ s.charCodeAt(--i)
  return hash >>> 0
}

/**
 * Returns a (stably) sorted copy of list, ranked in ascending order by the results of running each value through iteratee
 *
 * This implementation treats null/undefined sort keys as less than every other type
 *
 * @param  {Array}   collection
 * @param  {Function} fn The function used to resolve sort keys
 * @param {Object} ctx The context to use for calling `fn`
 * @return {Array} Returns a new sorted array by the given iteratee
 */
export function sortBy (collection, fn, ctx) {
  let sortKeys = {}
  let sorted = []
  let len = collection.length
  let result = []

  fn = fn.bind(ctx)

  for (let i = 0; i < len; i++) {
    let obj = collection[i]
    let key = fn(obj, i)
    if (isNil(key)) {
      // objects with null keys will go in first
      result.push(obj)
    } else {
      let hash = getHash(obj)
      if (!has(sortKeys, hash)) {
        sortKeys[hash] = [key, i]
      }
      sorted.push(obj)
    }
  }
  // use native array sorting but enforce stableness
  sorted.sort((a, b) => {
    let A = sortKeys[getHash(a)]
    let B = sortKeys[getHash(b)]
    if (A[0] < B[0]) return -1
    if (A[0] > B[0]) return 1
    if (A[1] < B[1]) return -1
    if (A[1] > B[1]) return 1
    return 0
  })
  return into(result, sorted)
}

/**
 * Groups the collection into sets by the returned key
 *
 * @param collection
 * @param fn {Function} to compute the group key of an item in the collection
 * @param ctx {Object} The context to use for calling `fn`
 * @returns {{keys: Array, groups: Array}}
 */
export function groupBy (collection, fn, ctx) {
  let result = {
    'keys': [],
    'groups': []
  }
  let lookup = {}
  fn = fn.bind(ctx)
  each(collection, (obj) => {
    let key = fn(obj)
    let hash = getHash(key)
    let index = -1

    if (isUndefined(lookup[hash])) {
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
  Array.prototype.push.apply(target, xs)
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
      let key = getHash(args)
      if (!has(cache, key)) {
        cache[key] = fn.apply(this, args)
      }
      return cache[key]
    }
  })({/* storage */})
}