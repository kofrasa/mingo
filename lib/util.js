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
 * @param obj
 * @returns {*}
 */
export function clone (obj) {
  switch (jsType(obj)) {
    case T_ARRAY:
      return obj.map(clone)
    case T_OBJECT:
      return map(obj, clone)
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
export function isArray (v) { return jsType(v) === T_ARRAY }
export function isArrayLike (v) { return !isNil(v) && has(v, 'length') }
export function isObject (v) { return jsType(v) === T_OBJECT }
export function isObjectLike (v) { return v === Object(v) } // objects, arrays, functions, date, custom object
export function isDate (v) { return jsType(v) === T_DATE }
export function isRegExp (v) { return jsType(v) === T_REGEXP }
export function isFunction (v) { return jsType(v) === T_FUNCTION }
export function isNil (v) { return isNull(v) || isUndefined(v) }
export function isNull (v) { return jsType(v) === T_NULL }
export function isUndefined (v) { return jsType(v) === T_UNDEFINED }
export function inArray (arr, item) { return arr.includes(item) }
export function notInArray (arr, item) { return !arr.includes(item) }
export function truthy (arg) { return !!arg }
export function falsey (arg) { return !arg }
export function isEmpty (x) {
  return isNil(x) ||
    isArray(x) && x.length === 0 ||
    isObject(x) && keys(x).length === 0 || !x
}
// ensure a value is an array
export function array (x) { return isArray(x) ? x : [x] }
export function has (obj, prop) { return obj.hasOwnProperty(prop) }
export function err (s) { throw new Error(s) }
export function keys (o) { return Object.keys(o) }

// ////////////////// UTILS ////////////////////

// internal constants
const __MINGO_META = '__mingo__'

export function addMeta (obj, value) {
  obj[__MINGO_META] = Object.assign(obj[__MINGO_META] || {}, value)
}

export function hasMeta (obj, value) {
  return has(obj, __MINGO_META) && isObject(value) && isEqual(Object.assign({}, obj[__MINGO_META], value), obj[__MINGO_META])
}

export function dropMeta (obj) {
  if (has(obj, __MINGO_META)) delete obj[__MINGO_META]
}

/**
 * Iterate over an array or object
 * @param  {Array|Object} obj An object-like value
 * @param  {Function} fn The callback to run per item
 * @param  {*}   ctx  The object to use a context
 * @return {void}
 */
export function each (obj, fn, ctx = null) {
  assert(obj === Object(obj), "Cannot iterate over object of type '" + jsType(obj) + "'")

  if (isArrayLike(obj)) {
    for (let i = 0, len = obj.length; i < len; i++) {
      if (fn.call(ctx, obj[i], i, obj) === false) break
    }
  } else {
    for (let k in obj) {
      if (has(obj, k)) {
        if (fn.call(ctx, obj[k], k, obj) === false) break
      }
    }
  }
}

/**
 * Transform values in a collection
 *
 * @param  {Array|Object}   obj   An array/object whose values to transform
 * @param  {Function} fn The transform function
 * @param  {*}   ctx The value to use as the "this" context for the transform
 * @return {Array|Object} Result object after applying the transform
 */
export function map (obj, fn, ctx = null) {
  if (isArray(obj)) {
    return obj.map(fn, ctx)
  } else if (isObject(obj)) {
    let o = {}
    each(obj, (v, k) => o[k] = fn.call(ctx, v, k), obj)
    return o
  }
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
  function unwrap(ys, iter) {
    for (let i = 0, len = ys.length; i < len; i++) {
      if (isArray(ys[i]) && (iter > 0 || iter < 0)) {
        unwrap(ys[i], Math.max(-1, iter - 1))
      } else {
        arr.push(ys[i])
      }
    }
  }
  unwrap(xs, depth)
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
  // strictly equal must be equal.
  if (a === b) return true

  // unequal types and functions cannot be equal.
  let type = jsType(a)
  if (type !== jsType(b) || type === T_FUNCTION) return false

  // we treat NaN as the same
  if (type === T_NUMBER && isNaN(a) && isNaN(b)) return true

  // leverage toString for Date and RegExp types
  if (inArray([T_DATE, T_REGEXP], type)) return a.toString() === b.toString()

  if (type === T_ARRAY) {
    if (a.length === b.length && a.length === 0) return true
    if (a.length !== b.length) return false
    for (let i = 0, len = a.length; i < len; i++) {
      if (!isEqual(a[i], b[i])) return false
    }
  } else if (type === T_OBJECT) {
    // deep compare objects
    let ka = keys(a)
    let kb = keys(b)

    // check length of keys early
    if (ka.length !== kb.length) return false

    // we know keys are strings so we sort before comparing
    ka.sort()
    kb.sort()

    // compare keys
    if (!isEqual(ka, kb)) return false

    // back to the drawing board
    for (let i = 0, len = ka.length; i < len; i++) {
      let temp = ka[i]
      if (!isEqual(a[temp], b[temp])) return false
    }
  } else {
    // we do not know how to compare custom types so we guess
    return getHash(a) === getHash(b)
  }
  // best effort says values are equal :)
  return true
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
 * Generates a random string of max length range [24,27]
 * @param n Size of string to return
 * @returns {*}
 */
function randomString(n) {
  return (Math.E + Math.random()).toString(36).slice(2, n+2)
}

/**
 * Encode value using a simple optimistic stable scheme.
 * @param value
 * @returns {*}
 */
export function encode (value) {
  let type = jsType(value)
  switch (type) {
    case T_FUNCTION:
      return randomString(7)
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
      return '[' + map(value, (v) => `${encode(v)}`) + ']'
    default:
      let prefix = (type === T_OBJECT)? '' : `${getType(value)}|`
      let objKeys = keys(value)
      objKeys.sort()
      return `${prefix}{` + map(objKeys, (k) => `${encode(k)}:${encode(value[k])}`) + '}'
  }
}

/**
 * Generate hash code
 * http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
 *
 * @param value
 * @returns {*}
 */
export function getHash (value) {
  let hash = 0, i, chr, len, s = encode(value)
  if (s.length === 0) return hash
  for (i = 0, len = s.length; i < len; i++) {
    chr = s.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash.toString()
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
export function sortBy (collection, fn, ctx = null) {
  let sortKeys = {}
  let sorted = []
  let len = collection.length
  let result = []

  for (let i = 0; i < len; i++) {
    let obj = collection[i]
    let key = fn.call(ctx, obj, i)
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
  each(collection, (obj) => {
    let key = fn.call(ctx, obj)
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
 * @param {*} key The search key
 */
export function findInsertIndex (array, key) {
  // uses binary search
  let lo = 0
  let hi = array.length - 1
  while (lo <= hi) {
    let mid = Math.round(lo + (hi - lo) / 2)
    if (key < array[mid]) {
      hi = mid - 1
    } else if (key > array[mid]) {
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