
function util () {
  return {
    'isArray': isArray,
    'isBoolean': isBoolean,
    'isDate': isDate,
    'isEmpty': isEmpty,
    'isEqual': isEqual,
    'isFunction': isFunction,
    'isNil': isNil,
    'isNull': isNull,
    'isNumber': isNumber,
    'isObject': isObject,
    'isObjectLike': isObjectLike,
    'isRegExp': isRegExp,
    'isString': isString,
    'isUndefined': isUndefined
  }
}

function assert (condition, message) {
  if (falsey(condition)) err(message)
}

function assertExists (value) {
  return assert(!isUndefined(value))
}

/**
 * Deep clone an object
 */
function clone (arg) {
  switch (getType(arg)) {
    case 'array':
      return arg.map(clone)
    case 'object':
      return map(arg, clone)
    default:
      return arg
  }
}

function isType (v, n) { return getType(v) === n }
function isBoolean (v) { return isType(v, 'boolean') }
function isString (v) { return isType(v, 'string') }
function isNumber (v) { return isType(v, 'number') }
function isArray (v) { return isType(v, 'array') }
function isObject (v) { return isType(v, 'object') }
function isObjectLike (v) { return v === Object(v) } // objects, arrays, functions
function isDate (v) { return isType(v, 'date') }
function isRegExp (v, t) { return isType(v, 'regexp') }
function isFunction (v, t) { return isType(v, 'function') }
function isNil (v) { return isNull(v) || isUndefined(v) }
function isNull (v) { return isType(v, 'null') }
function isUndefined (v) { return isType(v, 'undefined') }
function inArray (arr, item) { return arr.includes(item) }
function notInArray (arr, item) { return !arr.includes(item) }
function truthy (arg) { return !!arg }
function falsey (arg) { return !arg }
function isEmpty (x) {
  return isNil(x) ||
    isArray(x) && x.length === 0 ||
    isObject(x) && keys(x).length === 0 ||
    !x
}
// TODO: convert arguments to array
function array (x) { return isArray(x) ? x : [x] }
function getType (value) { return ObjectProto.toString.call(value).match(/\s(\w+)/)[1].toLowerCase() }
function has (obj, prop) { return ObjectProto.hasOwnProperty.call(obj, prop) }
function err (s) { throw new Error(s) }
function keys (o) { return Object.keys(o) }

// ////////////////// UTILS ////////////////////

/**
 * Iterate over an array or object
 * @param  {Array|Object} obj An object-like value
 * @param  {Function} callback The callback to run per item
 * @param  {*}   ctx  The object to use a context
 * @return {void}
 */
function each (obj, callback, ctx) {
  assert(obj === Object(obj), "Cannot iterate over object of type '" + getType(obj) + "'")
  if (isArray(obj)) {
    obj.forEach(callback, ctx)
  } else {
    for (var k in obj) {
      if (has(obj, k)) {
        callback.call(ctx, obj[k], k)
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
function map (obj, callback, ctx) {
  if (isArray(obj)) {
    return obj.map(callback, ctx)
  } else if (isObject(obj)) {
    var o = {}
    var arr = keys(obj)
    for (var k, i = 0, len = arr.length; i < len; i++) {
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
function intersection (xs, ys) {
  return xs.filter(inArray.bind(null, ys))
}

/**
 * Returns the union of two arrays
 *
 * @param  {Array} xs The first array
 * @param  {Array} ys The second array
 * @return {Array}   The result array
 */
function union (xs, ys) {
  var arr = []
  into(arr, xs)
  into(arr, ys.filter(notInArray.bind(null, xs)))
  return arr
}

/**
 * Flatten the array
 *
 * @param  {Array} xs The array to flatten
 * @return {Array} depth The number of nested lists to interate
 */
function flatten (xs, depth) {
  assert(isArray(xs), 'Input must be an Array')
  var arr = []
  var unwrap = function (ys, iter) {
    for (var i = 0, len = ys.length; i < len; i++) {
      if (isArray(ys[i]) && (iter > 0 || iter < 0)) {
        unwrap(ys[i], Math.max(-1, iter - 1))
      } else {
        arr.push(ys[i])
      }
    }
  }
  unwrap(xs, depth || -1)
  return arr
}

/**
 * Determine whether two values are the same or strictly equivalent
 *
 * @param  {*}  a The first value
 * @param  {*}  b The second value
 * @return {Boolean}   Result of comparison
 */
function isEqual (a, b) {
  // strictly equal must be equal.
  if (a === b) return true

  // unequal types cannot be equal.
  var type = getType(a)
  if (type !== getType(b)) return false

  // we treat NaN as the same
  if (type === 'number' && isNaN(a) && isNaN(b)) return true

  // leverage toString for Date and RegExp types
  if (inArray(['date', 'regexp'], type)) return a.toString() === b.toString()

  var i // loop counter
  var len // loop length

  if (type === 'array') {
    if (a.length === b.length && a.length === 0) return true
    if (a.length !== b.length) return false
    for (i = 0, len = a.length; i < len; i++) {
      if (!isEqual(a[i], b[i])) return false
    }
  } else if ([a, b].every(isObject)) {
    // deep compare objects
    var ka = keys(a)
    var kb = keys(b)

    // check length of keys early
    if (ka.length !== kb.length) return false

    // we know keys are strings so we sort before comparing
    ka.sort()
    kb.sort()

    // compare keys
    if (!isEqual(ka, kb)) return false

    // back to the drawing board
    for (i = 0, len = ka.length; i < len; i++) {
      var temp = ka[i]
      if (!isEqual(a[temp], b[temp])) return false
    }
  } else {
    // we do not know how to compare unknown types
    return false
  }
  // best effort says values are equal :)
  return true
}

/**
 * Return a new unique version of the collection
 * @param  {Array} xs The input collection
 * @return {Array}    A new collection with unique values
 */
function unique (xs) {
  var h = {}
  var arr = []
  each(xs, function (item) {
    var k = getHash(item)
    if (!has(h, k)) {
      arr.push(item)
      h[k] = 0
    }
  })
  return arr
}

// encode value using a simple optimistic scheme
function encode (value) {
  return JSON.stringify({'': value}) + getType(value) + value
}

// http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function getHash (value) {
  var hash = 0, i, chr, len, s = encode(value)
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
 * @param  {Array}   collection [description]
 * @param  {Function} fn The function used to sort
 * @return {Array} Returns a new sorted array by the given iteratee
 */
function sortBy (collection, fn, ctx) {
  var sortKeys = {}
  var sorted = []
  var key, val, hash, len = collection.length
  for (var i = 0; i < len; i++) {
    val = collection[i]
    key = fn.call(ctx, val, i)
    hash = getHash(val)
    if (!has(sortKeys, hash)) {
      sortKeys[hash] = [key, i]
    }
    sorted.push(clone(val))
  }
  // use native array sorting but enforce stableness
  sorted.sort(function (a, b) {
    var A = sortKeys[getHash(a)]
    var B = sortKeys[getHash(b)]
    if (A[0] < B[0]) return -1
    if (A[0] > B[0]) return 1
    if (A[1] < B[1]) return -1
    if (A[1] > B[1]) return 1
    return 0
  })
  assert(sorted.length === collection.length, 'sortBy must retain collection length')
  return sorted
}

/**
 * Groups the collection into sets by the returned key
 *
 * @param collection
 * @param fn {function} to compute the group key of an item in the collection
 */
function groupBy (collection, fn, ctx) {
  var result = {
    'keys': [],
    'groups': []
  }

  var lookup = {}

  each(collection, function (obj) {
    var key = fn.call(ctx, obj)
    var hash = getHash(key)
    var index = -1

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
function into (target, xs) {
  ArrayProto.push.apply(target, xs)
}

/**
 * Find the insert index for the given key in a sorted array.
 *
 * @param {*} array The sorted array to search
 * @param {*} key The search key
 */
function findInsertIndex(array, key) {
  // uses binary search
  var lo = 0
  var hi = array.length - 1
  while (lo <= hi) {
    var mid = lo + (hi - lo) / 2
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