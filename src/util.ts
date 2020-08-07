/**
 * Utility constants and functions
 */

export const MAX_INT = 2147483647
export const MIN_INT = -2147483648
export const MAX_LONG = Number.MAX_SAFE_INTEGER
export const MIN_LONG = Number.MIN_SAFE_INTEGER

// special value to identify missing items. treated differently from undefined
const MISSING = () => { }

// Javascript native types
export enum JsType {
  NULL = 'null',
  UNDEFINED = 'undefined',
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  STRING = 'string',
  DATE = 'date',
  REGEXP = 'regexp',
  ARRAY = 'array',
  OBJECT = 'object',
  FUNCTION = 'function'
}

// MongoDB BSON types
export enum BsonType {
  BOOL = 'bool',
  INT = 'int',
  LONG = 'long',
  DOUBLE = 'double',
  DECIMAL = 'decimal',
  REGEX = 'regex'
}

// Generic callback
export interface Callback<T> {
  (...args: any): T
}

// Generic predicate
export interface Predicate<T> {
  (...args: T[]): boolean
}

// Result of comparator function
type CompareResult = -1 | 0 | 1

// Generic comparator callback
export interface Comparator<T> {
  (left: T, right: T): CompareResult
}

// Options to resolve() and resolveGraph() functions
interface ResolveOptions {
  unwrapArray?: boolean
  preserveMissing?: boolean
}

// no array, object, or function types
const JS_SIMPLE_TYPES = [JsType.NULL, JsType.UNDEFINED, JsType.BOOLEAN, JsType.NUMBER, JsType.STRING, JsType.DATE, JsType.REGEXP]

export function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

/**
 * Deep clone an object
 */
export function cloneDeep(obj: any): any {
  if (isArray(obj)) return obj.map(cloneDeep)
  if (isDate(obj)) return new Date(obj)
  if (isObject(obj)) return objectMap(obj, cloneDeep)
  return obj
}

/**
 * Returns the name of type of value given by its constructor.
 * If missing returns "null" or "undefined" their respective values.
 * @param v A value
 */
export function getType(v: any): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  return v.constructor.name
}
export function isBoolean(v: any): v is boolean { return typeof v === JsType.BOOLEAN }
export function isString(v: any): v is string { return typeof v === JsType.STRING }
export function isNumber(v: any): v is number { return !isNaN(v) && typeof v === JsType.NUMBER }
export const isArray = Array.isArray || (v => v instanceof Array)
export function isObject(v: any): boolean { return !!v && v.constructor === Object }
export function isObjectLike(v: any): boolean { return v === Object(v) } // objects, arrays, functions, date, custom object
export function isDate(v: any): boolean { return v instanceof Date }
export function isRegExp(v: any): boolean { return v instanceof RegExp }
export function isFunction(v: any) { return typeof v === JsType.FUNCTION }
export function isNil(v: any): boolean { return v === null || v === undefined }
export function isNull(v: any): boolean { return v === null }
export function isUndefined(v: any): boolean { return v === undefined }
export const inArray = (() => {
  // if Array.includes is not supported
  if (!Array.prototype.includes) {
    return (arr: any[], item: any): boolean => isNaN(item) && !isString(item) ? arr.some(v => isNaN(v) && !isString(v)) : arr.indexOf(item) > -1
  }
  // default
  return (arr: Array<any>, item: any): boolean => arr.includes(item)
})()
export function notInArray(arr: any[], item: any): boolean { return !inArray(arr, item) }
export function truthy(arg: any): boolean { return !!arg }
export function isEmpty(x: any): boolean {
  return isNil(x) ||
    isArray(x) && x.length === 0 ||
    isObject(x) && keys(x).length === 0 || !x
}
// ensure a value is an array or wrapped within one
export function ensureArray(x: any): any[] { return x instanceof Array ? x : [x] }
export function has(obj: object, prop: any): boolean { return !!obj && obj.hasOwnProperty(prop) }
export const keys = Object.keys

/**
 * Iterate over an array or object
 * @param  {Array|Object} obj An object-like value
 * @param  {Function} fn The callback to run per item
 * @param  {*}   ctx  The object to use a context
 * @return {void}
 */
export function each(obj: object, fn: Callback<any>): void {
  if (obj instanceof Array) {
    let arr = obj as any[]
    for (let i = 0, len = arr.length; i < len; i++) {
      if (fn(arr[i], i) === false) break
    }
  } else {
    let arr = keys(obj)
    for (let i = 0, len = arr.length; i < len; i++) {
      fn(obj[arr[i]], arr[i])
    }
  }
}

/**
 * Transform values in an object
 *
 * @param  {Object}   obj   An object whose values to transform
 * @param  {Function} fn The transform function
 * @return {Array|Object} Result object after applying the transform
 */
export function objectMap(obj: object, fn: Callback<any>): object {
  let o = {}
  let objKeys = keys(obj)
  for (let i = 0; i < objKeys.length; i++) {
    let k = objKeys[i]
    o[k] = fn(obj[k], k)
  }
  return o
}

// Options to merge function
interface MergeOptions {
  flatten?: boolean
}

/**
 * Deep merge objects or arrays.
 * When the inputs have unmergeable types, the source value (right hand side) is returned.
 * If inputs are arrays of same length and all elements are mergable, elements in the same position are merged together.
 * If any of the elements are unmergeable, elements in the source are appended to the target.
 * @param target {Object|Array} the target to merge into
 * @param obj {Object|Array} the source object
 */
export function merge(target: object, obj: object, options?: MergeOptions): object {
  // take care of missing inputs
  if (target === MISSING) return obj
  if (obj === MISSING) return target

  const inputs = [target, obj]

  if (!(inputs.every(isObject) || inputs.every(isArray))) {
    throw Error('mismatched types. must both be array or object')
  }

  // default options
  options = options || { flatten: false }

  if (isArray(target)) {
    let result = target as any[]
    let input = obj as any[]

    if (options.flatten) {
      let i = 0
      let j = 0
      while (i < result.length && j < input.length) {
        result[i] = merge(result[i++], input[j++], options)
      }
      while (j < input.length) {
        result.push(obj[j++])
      }
    } else {
      Array.prototype.push.apply(result, input)
    }
  } else {
    Object.keys(obj).forEach((k) => {
      if (has(target, k)) {
        target[k] = merge(target[k], obj[k], options)
      } else {
        target[k] = obj[k]
      }
    })
  }

  return target
}

/**
 * Returns the intersection between two arrays
 *
 * @param  {Array} xs The first array
 * @param  {Array} ys The second array
 * @return {Array}    Result array
 */
export function intersection(a: any[], b: any[]): any[] {
  let flipped = false

  // we ensure the left array is always smallest
  if (a.length > b.length) {
    let t = a
    a = b
    b = t
    flipped = true
  }

  let maxSize = Math.max(a.length, b.length)
  let maxResult = Math.min(a.length, b.length)

  let lookup = a.reduce((memo, v, i) => {
    memo[hashCode(v)] = i
    return memo
  }, {})

  let indexes = []

  for (let i = 0, j = 0; i < maxSize && j < maxResult; i++) {
    let k = lookup[hashCode(b[i])]
    if (k !== undefined) {
      indexes.push(k)
      j++
    }
  }

  // unless we flipped the arguments we must sort the indexes to keep stability
  if (!flipped) indexes.sort()

  return indexes.map(i => a[i])
}

/**
 * Returns the union of two arrays
 *
 * @param  {Array} xs The first array
 * @param  {Array} ys The second array
 * @return {Array}   The result array
 */
export function union(xs: any[], ys: any[]): any[] {
  return into(into([], xs), ys.filter(notInArray.bind(null, xs)))
}

/**
 * Flatten the array
 *
 * @param  {Array} xs The array to flatten
 * @param {Number} depth The number of nested lists to iterate
 */
export function flatten(xs: any[], depth: number): any[] {
  let arr = []
  function flatten2(ys: any[], n: number) {
    for (let i = 0, len = ys.length; i < len; i++) {
      if (isArray(ys[i]) && (n > 0 || n < 0)) {
        flatten2(ys[i], Math.max(-1, n - 1))
      } else {
        arr.push(ys[i])
      }
    }
  }
  flatten2(xs, depth)
  return arr
}

/**
 * Determine whether two values are the same or strictly equivalent
 *
 * @param  {*}  a The first value
 * @param  {*}  b The second value
 * @return {Boolean}   Result of comparison
 */
export function isEqual(a: any, b: any): boolean {

  let lhs = [a]
  let rhs = [b]

  while (lhs.length > 0) {

    a = lhs.pop()
    b = rhs.pop()

    // strictly equal must be equal.
    if (a === b) continue

    // unequal types and functions cannot be equal.
    let nativeType = getType(a).toLowerCase()
    if (nativeType !== getType(b).toLowerCase() || nativeType === JsType.FUNCTION) return false

    // leverage toString for Date and RegExp types
    switch (nativeType) {
      case JsType.ARRAY:
        if (a.length !== b.length) return false
        if (a.length === b.length && a.length === 0) continue
        into(lhs, a)
        into(rhs, b)
        break
      case JsType.OBJECT:
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
          let tempKey = ka[i]
          if (tempKey !== kb[i]) {
            return false
          } else {
            // save later work
            lhs.push(a[tempKey])
            rhs.push(b[tempKey])
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
export function unique(xs: any[]): any[] {
  let h = {}
  let arr = []
  each(xs, item => {
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
function encode(value: any): string {
  let type = getType(value).toLowerCase()
  switch (type) {
    case JsType.BOOLEAN:
    case JsType.NUMBER:
    case JsType.REGEXP:
      return value.toString()
    case JsType.STRING:
      return JSON.stringify(value)
    case JsType.DATE:
      return value.toISOString()
    case JsType.NULL:
    case JsType.UNDEFINED:
      return type
    case JsType.ARRAY:
      return '[' + value.map(encode) + ']'
    default:
      let prefix = (type === JsType.OBJECT) ? '' : `${getType(value)}`
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
 * @returns {number|null}
 */
export function hashCode(value: any): number | null {
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
export function compare(a: any, b: any): CompareResult {
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
 * @param {Function} keyFn The sort key function used to resolve sort keys
 * @param {Function} comparator The comparator function to use for comparing keys. Defaults to standard comparison via `compare(...)`
 * @return {Array} Returns a new sorted array by the given key and comparator function
 */
export function sortBy(collection: any[], keyFn: Callback<any>, comparator?: Comparator<any>): any[] {
  let sorted = []
  let result = []
  let hash = {}
  comparator = comparator || compare

  if (isEmpty(collection)) return collection

  for (let i = 0; i < collection.length; i++) {
    let obj = collection[i]

    let key = keyFn(obj, i)

    // objects with nil keys will go in first
    if (isNil(key)) {
      result.push(obj)
    } else {

      // null suffix to differentiate string keys from native object properties
      if (isString(key)) key += '\0'

      if (hash[key]) {
        hash[key].push(obj)
      } else {
        hash[key] = [obj]
      }
      sorted.push(key)
    }
  }

  // use native array sorting but enforce stableness
  sorted.sort(comparator)

  for (let i = 0; i < sorted.length; i++) {
    into(result, hash[sorted[i]])
  }

  return result
}

/**
 * Groups the collection into sets by the returned key
 *
 * @param collection
 * @param keyFn {Function} to compute the group key of an item in the collection
 * @returns {{keys: Array, groups: Array}}
 */
export function groupBy(collection: any[], keyFn: Callback<any>): { keys: any[], groups: any[] } {
  let result = {
    keys: [],
    groups: []
  }

  let lookup = {}

  each(collection, obj => {
    let key = keyFn(obj)
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

// max elements to push.
// See argument limit https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
const MAX_ARRAY_PUSH = 50000

/**
 * Merge elements into the dest
 *
 * @param {*} target The target object
 * @param {*} rest The array of elements to merge into dest
 */
export function into(target: any, ...rest: any[]): any {
  if (target instanceof Array) {
    return rest.reduce((acc, arr) => {
      // push arrary in batches to handle large inputs
      let i = Math.ceil(arr.length / MAX_ARRAY_PUSH)
      let begin = 0
      while (i-- > 0) {
        Array.prototype.push.apply(acc, arr.slice(begin, begin + MAX_ARRAY_PUSH))
        begin += MAX_ARRAY_PUSH
      }
      return acc
    }, target)
  } else if (isObject(target)) {
    // merge objects. same behaviour as Object.assign
    return rest.filter(isObjectLike).reduce((acc, item) => {
      each(item, (v, k) => acc[k] = v)
      return acc
    }, target)
  }

  return null
}

/**
 * This is a generic memoization function
 *
 * This implementation uses a cache independent of the function being memoized
 * to allow old values to be garbage collected when the memoized function goes out of scope.
 *
 * @param {*} fn The function object to memoize
 */
export function memoize(fn: Callback<any>): Callback<any> {
  return ((memo) => {
    return (...args: any): any => {
      let key = hashCode(args)
      if (!has(memo, key)) {
        memo[key] = fn.apply(this, args)
      }
      return memo[key]
    }
  })({/* storage */ })
}

// mingo internal

/**
 * Retrieve the value of a given key on an object
 * @param obj
 * @param field
 * @returns {*}
 * @private
 */
function getValue(obj: object, field: any): any {
  return isObjectLike(obj) ? obj[field] : undefined
}

/**
 * Unwrap a single element array to specified depth
 * @param {Array} arr
 * @param {Number} depth
 */
function unwrap(arr: any[], depth: number): any[] {
  if (depth < 1) return arr
  while (depth-- && arr.length === 1) arr = arr[0]
  return arr
}

/**
 * Resolve the value of the field (dot separated) on the given object
 * @param obj {Object} the object context
 * @param selector {String} dot separated path to field
 * @returns {*}
 */
export function resolve(obj: object | any[], selector: string, options?: ResolveOptions): any {
  let depth = 0

  // options
  options = options || { unwrapArray: false }

  function resolve2(o: object | any[], path: string[]): any {
    let value = o
    for (let i = 0; i < path.length; i++) {
      let field = path[i]
      let isText = field.match(/^\d+$/) === null

      // using instanceof to aid typescript compiler
      if (isText && value instanceof Array) {
        // On the first iteration, we check if we received a stop flag.
        // If so, we stop to prevent iterating over a nested array value
        // on consecutive object keys in the selector.
        if (i === 0 && depth > 0) break

        depth += 1
        // only look at the rest of the path
        let subpath = path.slice(i)
        value = value.reduce<any[]>((acc: any[], item: any) => {
          let v = resolve2(item, subpath)
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

  obj = inArray(JS_SIMPLE_TYPES, getType(obj).toLowerCase()) ? obj : resolve2(obj, selector.split('.'))

  return obj instanceof Array && options.unwrapArray ? unwrap(obj, depth) : obj
}

/**
 * Returns the full object to the resolved value given by the selector.
 * This function excludes empty values as they aren't practically useful.
 *
 * @param obj {Object} the object context
 * @param selector {String} dot separated path to field
 */
export function resolveGraph(obj: object, selector: string, options?: ResolveOptions): any {
  // options
  if (options === undefined) {
    options = { preserveMissing: false }
  }

  let names: string[] = selector.split('.')
  let key = names[0]
  // get the next part of the selector
  let next = names.slice(1).join('.')
  let isIndex = key.match(/^\d+$/) !== null
  let hasNext = names.length > 1
  let result: any
  let value: any

  if (obj instanceof Array) {
    if (isIndex) {
      result = getValue(obj, Number(key))
      if (hasNext) {
        result = resolveGraph(result, next, options)
      }
      result = [result]
    } else {
      result = []
      each(obj, item => {
        value = resolveGraph(item, selector, options)
        if (options.preserveMissing) {
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
      value = resolveGraph(value, next, options)
    }
    if (value === undefined) return undefined
    result = {}
    result[key] = value
  }

  return result
}

/**
 * Filter out all MISSING values from the object in-place
 *
 * @param obj The object to filter
 */
export function filterMissing(obj: object): object {
  if (obj instanceof Array) {
    for (let i = obj.length - 1; i >= 0; i--) {
      if (obj[i] === MISSING) {
        obj.splice(i, 1)
      } else {
        filterMissing(obj[i])
      }
    }
  } else if (isObject(obj)) {
    for (let k in obj) {
      if (has(obj, k)) {
        filterMissing(obj[k])
      }
    }
  }
  return obj
}

/**
 * Walk the object graph and execute the given transform function
 *
 * @param  {Object|Array} obj   The object to traverse
 * @param  {String} selector    The selector
 * @param  {Function} fn Function to execute for value at the end the traversal
 * @param  {Boolean} force Force generating missing parts of object graph
 * @return {*}
 */
export function traverse(obj: object, selector: string, fn: Callback<void>, force?: boolean): void {
  let names = selector.split('.')
  let key = names[0]
  let next = names.slice(1).join('.')

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
export function setValue(obj: object, selector: string, value: any): void {
  traverse(obj, selector, (item: object, key: any) => {
    item[key] = value
  }, true)
}

export function removeValue(obj: any, selector: any): void {
  traverse(obj, selector, (item: any, key: any) => {
    if (item instanceof Array && /^\d+$/.test(key)) {
      item.splice(parseInt(key), 1)
    } else if (isObject(item)) {
      delete item[key]
    }
  })
}

const OPERATOR_NAME_PATTERN = /^\$[a-zA-Z0-9_]+$/
/**
 * Check whether the given name passes for an operator. We assume any field name starting with '$' is an operator.
 * This is cheap and safe to do since keys beginning with '$' should be reserved for internal use.
 * @param {String} name
 */
export function isOperator(name: string): boolean {
  return OPERATOR_NAME_PATTERN.test(name)
}

/**
 * Simplify expression for easy evaluation with query operators map
 * @param expr
 * @returns {*}
 */
export function normalize(expr: any): any {
  // normalized primitives
  if (inArray(JS_SIMPLE_TYPES, getType(expr).toLowerCase())) {
    return isRegExp(expr) ? { '$regex': expr } : { '$eq': expr }
  }

  // normalize object expression. using ObjectLike handles custom types
  if (isObjectLike(expr)) {

    // no valid query operator found, so we do simple comparison
    if (!keys(expr).some(isOperator)) {
      return { '$eq': expr }
    }

    // ensure valid regex
    if (has(expr, '$regex')) {
      expr['$regex'] = new RegExp(expr['$regex'], expr['$options'])
      delete expr['$options']
    }
  }

  return expr
}