/**
 * Utility functions
 */

export function assert (condition, message) {
  if (falsey(condition)) err(message)
}

/**
 * Deep clone an object
 */
export function clone (arg) {
  switch (jsType(arg)) {
    case 'array':
      return arg.map(clone)
    case 'object':
      return map(arg, clone)
    default:
      return arg
  }
}

export const JS_PRIMITIVES = ['null', 'undefined', 'boolean', 'number', 'string', 'date', 'regexp']

export function getType (v) {
  if (v === null) return "Null"
  if (v === undefined) return "Undefined"
  return v.constructor.name
}
export function jsType (v) { return getType(v).toLowerCase() }
export function isBoolean (v) { return jsType(v) === 'boolean' }
export function isString (v) { return jsType(v) === 'string' }
export function isNumber (v) { return jsType(v) === 'number' }
export function isArray (v) { return jsType(v) === 'array' }
export function isObject (v) { return jsType(v) === 'object' }
export function isObjectLike (v) { return v === Object(v) } // objects, arrays, functions, date, custom object
export function isDate (v) { return jsType(v) === 'date' }
export function isRegExp (v) { return jsType(v) === 'regexp' }
export function isFunction (v) { return jsType(v) === 'function' }
export function isNil (v) { return isNull(v) || isUndefined(v) }
export function isNull (v) { return jsType(v) === 'null' }
export function isUndefined (v) { return jsType(v) === 'undefined' }
export function inArray (arr, item) { return arr.includes(item) }
export function notInArray (arr, item) { return !arr.includes(item) }
export function truthy (arg) { return !!arg }
export function falsey (arg) { return !arg }
export function isEmpty (x) {
  return isNil(x) ||
    isArray(x) && x.length === 0 ||
    isObject(x) && keys(x).length === 0 || !x
}
// TODO: convert arguments to array
export function array (x) { return isArray(x) ? x : [x] }
export function has (obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop) }
export function err (s) { throw new Error(s) }
export function keys (o) { return Object.keys(o) }

// ////////////////// UTILS ////////////////////

export function addMeta (obj, value) {
  obj.__mingo__ = Object.assign(obj.__mingo__ || {}, value)
}

export function hasMeta (obj, value) {
  return has(obj, '__mingo__') && isObject(value) && isEqual(Object.assign({}, obj.__mingo__, value), obj.__mingo__)
}

export function dropMeta (obj) {
  if (has(obj, '__mingo__')) delete obj.__mingo__
}

/**
 * Iterate over an array or object
 * @param  {Array|Object} obj An object-like value
 * @param  {Function} callback The callback to run per item
 * @param  {*}   ctx  The object to use a context
 * @return {void}
 */
export function each (obj, callback, ctx = null) {
  assert(obj === Object(obj), "Cannot iterate over object of type '" + jsType(obj) + "'")

  let done = false
  let halt = () => {
    done = true
    err('halt')
  }

  if (isArray(obj)) {
    for (let i = 0, len = obj.length; i < len; i++) {
      try {
        callback.call(ctx, obj[i], i, obj, halt);
      } catch (e) {
        assert(done, e.message)
        return
      }
    }
  } else {
    for (let k in obj) {
      if (has(obj, k)) {
        try {
          callback.call(ctx, obj[k], k, obj, halt)
        } catch (e) {
          assert(done, e.message)
          return
        }
      }
    }
  }
}

/**
 * Transform values in a collection
 *
 * @param  {Array|Object}   obj   An array/object whose values to transform
 * @param  {Function} callback The transform function
 * @param  {*}   ctx The value to use as the "this" context for the transform
 * @return {Array|Object} Result object after applying the transform
 */
export function map (obj, callback, ctx = null) {
  if (isArray(obj)) {
    return obj.map(callback, ctx)
  } else if (isObject(obj)) {
    let o = {}
    let arr = keys(obj)
    for (let k, i = 0, len = arr.length; i < len; i++) {
      k = arr[i]
      o[k] = callback.call(ctx, obj[k], k)
    }
    return o
  }
  err('Input must be an Array or Object type')
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
  let arr = []
  into(arr, xs)
  into(arr, ys.filter(notInArray.bind(null, xs)))
  return arr
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
  if (type !== jsType(b) || type === 'function') return false

  // we treat NaN as the same
  if (type === 'number' && isNaN(a) && isNaN(b)) return true

  // leverage toString for Date and RegExp types
  if (inArray(['date', 'regexp'], type)) return a.toString() === b.toString()

  if (type === 'array') {
    if (a.length === b.length && a.length === 0) return true
    if (a.length !== b.length) return false
    for (let i = 0, len = a.length; i < len; i++) {
      if (!isEqual(a[i], b[i])) return false
    }
  } else if ([a, b].every(isObject)) {
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
    // we do not know how to compare unknown types
    // so we attempt comparing their hashes
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
    case 'function':
      return randomString(7)
    case 'boolean':
    case 'number':
    case 'regex':
      return value.toString()
    case 'string':
      return JSON.stringify(value)
    case 'date':
      return value.toISOString()
    case 'null':
    case 'undefined':
      return type
    case 'array':
      return '[' + map(value, (v) => `${encode(v)}`) + ']'
    default:
      let prefix = !isObject(value)? `${getType(value)}|` : ''
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

  into(result, sorted)
  assert(result.length === collection.length, 'sortBy must retain collection length')
  return result
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

  assert(result.keys.length === result.groups.length, 'Cardinality must be equal for groups and keys')
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