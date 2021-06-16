/**
 * Utility constants and functions
 */

import { AnyVal, ArrayOrObject, Callback, RawArray, RawObject } from "./types";

/* backward-compatibility */
export {
  AnyVal,
  ArrayOrObject,
  Callback,
  Predicate,
  RawArray,
  RawObject,
} from "./types";

export const MAX_INT = 2147483647;
export const MIN_INT = -2147483648;
export const MAX_LONG = Number.MAX_SAFE_INTEGER;
export const MIN_LONG = Number.MIN_SAFE_INTEGER;

/**
 * Custom function to hash values to improve faster comparaisons
 */
export type HashFunction = Callback<string>;

// special value to identify missing items. treated differently from undefined
const MISSING = {};

const DEFAULT_HASH_FUNC: HashFunction = (value: AnyVal): string => {
  const s = encode(value);
  let hash = 0;
  let i = s.length;
  while (i) hash = ((hash << 5) - hash) ^ s.charCodeAt(--i);
  const code = hash >>> 0;
  return code.toString();
};

// Javascript native types
export enum JsType {
  NULL = "null",
  UNDEFINED = "undefined",
  BOOLEAN = "boolean",
  NUMBER = "number",
  STRING = "string",
  DATE = "date",
  REGEXP = "regexp",
  ARRAY = "array",
  OBJECT = "object",
  FUNCTION = "function",
}

// MongoDB BSON types
export enum BsonType {
  BOOL = "bool",
  INT = "int",
  LONG = "long",
  DOUBLE = "double",
  DECIMAL = "decimal",
  REGEX = "regex",
}

// Result of comparator function
type CompareResult = -1 | 0 | 1;

// Generic comparator callback
export interface Comparator<T> {
  (left: T, right: T): CompareResult;
}

// Options to resolve() and resolveGraph() functions
interface ResolveOptions {
  unwrapArray?: boolean;
  preserveMissing?: boolean;
}

// no array, object, or function types
const JS_SIMPLE_TYPES = [
  JsType.NULL,
  JsType.UNDEFINED,
  JsType.BOOLEAN,
  JsType.NUMBER,
  JsType.STRING,
  JsType.DATE,
  JsType.REGEXP,
];

const OBJECT_PROTOTYPE = Object.getPrototypeOf({}) as AnyVal;
const OBJECT_TAG = "[object Object]";
const OBJECT_TYPE_RE = /^\[object ([a-zA-Z0-9]+)\]$/;

export function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/**
 * Deep clone an object
 */
export function cloneDeep(obj: AnyVal): AnyVal {
  if (obj instanceof Array) return obj.map(cloneDeep);
  if (obj instanceof Date) return new Date(obj);
  if (isObject(obj)) return objectMap(obj as RawObject, cloneDeep);
  return obj;
}

/**
 * Returns the name of type as specified in the tag returned by a call to Object.prototype.toString
 * @param v A value
 */
export function getType(v: AnyVal): string {
  return OBJECT_TYPE_RE.exec(Object.prototype.toString.call(v))[1];
}
export function isBoolean(v: AnyVal): v is boolean {
  return typeof v === JsType.BOOLEAN;
}
export function isString(v: AnyVal): v is string {
  return typeof v === JsType.STRING;
}
export function isNumber(v: AnyVal): v is number {
  return !isNaN(v as number) && typeof v === JsType.NUMBER;
}
export const isArray = Array.isArray || ((v) => v instanceof Array);
export function isObject(v: AnyVal): boolean {
  if (!v) return false;
  const proto = Object.getPrototypeOf(v) as AnyVal;
  return (
    (proto === OBJECT_PROTOTYPE || proto === null) &&
    OBJECT_TAG === Object.prototype.toString.call(v)
  );
}
export function isObjectLike(v: AnyVal): boolean {
  return v === Object(v);
} // objects, arrays, functions, date, custom object
export function isDate(v: AnyVal): v is Date {
  return v instanceof Date;
}
export function isRegExp(v: AnyVal): v is RegExp {
  return v instanceof RegExp;
}
export function isFunction(v: AnyVal): boolean {
  return typeof v === JsType.FUNCTION;
}
export function isNil(v: AnyVal): boolean {
  return v === null || v === undefined;
}
export function isNull(v: AnyVal): boolean {
  return v === null;
}
export function isUndefined(v: AnyVal): boolean {
  return v === undefined;
}
export const inArray = (() => {
  // if Array.includes is not supported
  if (!Array.prototype.includes) {
    return (arr: RawArray, item: AnyVal): boolean =>
      isNaN(item as number) && !isString(item)
        ? arr.some((v) => isNaN(v as number) && !isString(v))
        : arr.indexOf(item) > -1;
  }
  // default
  return (arr: Array<AnyVal>, item: AnyVal): boolean => arr.includes(item);
})();
export function notInArray(arr: RawArray, item: AnyVal): boolean {
  return !inArray(arr, item);
}
export function truthy(arg: AnyVal): boolean {
  return !!arg;
}
export function isEmpty(x: AnyVal): boolean {
  return (
    isNil(x) ||
    (isString(x) && !x) ||
    (x instanceof Array && x.length === 0) ||
    (isObject(x) && Object.keys(x).length === 0)
  );
}
// ensure a value is an array or wrapped within one
export function ensureArray(x: AnyVal): RawArray {
  return x instanceof Array ? x : [x];
}
export function has(obj: RawObject, prop: string): boolean {
  return !!obj && (Object.prototype.hasOwnProperty.call(obj, prop) as boolean);
}

/**
 * Transform values in an object
 *
 * @param  {Object}   obj   An object whose values to transform
 * @param  {Function} fn The transform function
 * @return {Array|Object} Result object after applying the transform
 */
export function objectMap(obj: RawObject, fn: Callback<AnyVal>): RawObject {
  const o = {};
  const objKeys = Object.keys(obj);
  for (let i = 0; i < objKeys.length; i++) {
    const k = objKeys[i];
    o[k] = fn(obj[k], k);
  }
  return o;
}

// Options to merge function
interface MergeOptions {
  flatten?: boolean;
}

/**
 * Deep merge objects or arrays.
 * When the inputs have unmergeable types, the source value (right hand side) is returned.
 * If inputs are arrays of same length and all elements are mergable, elements in the same position are merged together.
 * If AnyVal of the elements are unmergeable, elements in the source are appended to the target.
 * @param target {Object|Array} the target to merge into
 * @param obj {Object|Array} the source object
 */
export function merge(
  target: ArrayOrObject,
  obj: ArrayOrObject,
  options?: MergeOptions
): ArrayOrObject {
  // take care of missing inputs
  if (target === MISSING) return obj;
  if (obj === MISSING) return target;

  const inputs = [target, obj];

  if (!(inputs.every(isObject) || inputs.every(isArray))) {
    throw Error("mismatched types. must both be array or object");
  }

  // default options
  options = options || { flatten: false };

  if (isArray(target)) {
    const result = target as Array<ArrayOrObject>;
    const input = obj as Array<ArrayOrObject>;

    if (options.flatten) {
      let i = 0;
      let j = 0;
      while (i < result.length && j < input.length) {
        result[i] = merge(result[i++], input[j++], options);
      }
      while (j < input.length) {
        result.push(obj[j++]);
      }
    } else {
      Array.prototype.push.apply(result, input);
    }
  } else {
    Object.keys(obj).forEach((k) => {
      if (has(target as RawObject, k)) {
        target[k] = merge(target[k], obj[k], options);
      } else {
        target[k] = obj[k] as AnyVal;
      }
    });
  }

  return target;
}

/**
 * Returns the intersection between two arrays
 *
 * @param  {Array} a The first array
 * @param  {Array} b The second array
 * @param  {Function} hashFunction Custom function to hash values, default the hashCode method
 * @return {Array}    Result array
 */
export function intersection(
  a: RawArray,
  b: RawArray,
  hashFunction?: HashFunction
): RawArray {
  let flipped = false;

  // we ensure the left array is always smallest
  if (a.length > b.length) {
    const t = a;
    a = b;
    b = t;
    flipped = true;
  }

  const maxSize = Math.max(a.length, b.length);
  const maxResult = Math.min(a.length, b.length);

  const lookup = a.reduce((memo, v, i) => {
    memo[hashCode(v, hashFunction)] = i;
    return memo;
  }, {});

  const indexes = new Array<number>();

  for (let i = 0, j = 0; i < maxSize && j < maxResult; i++) {
    const k = lookup[hashCode(b[i], hashFunction)] as number;
    if (k !== undefined) {
      indexes.push(k);
      j++;
    }
  }

  // unless we flipped the arguments we must sort the indexes to keep stability
  if (!flipped) indexes.sort();

  return indexes.map((i: number) => a[i]);
}

/**
 * Returns the union of two arrays
 *
 * @param  {Array} xs The first array
 * @param  {Array} ys The second array
 * @return {Array}   The result array
 */
export function union(xs: RawArray, ys: RawArray): RawArray {
  const result: RawArray = [];
  const filtered = ys.filter(notInArray.bind(null, xs));
  into(result, xs);
  into(result, filtered);
  return result;
}

/**
 * Flatten the array
 *
 * @param  {Array} xs The array to flatten
 * @param {Number} depth The number of nested lists to iterate
 */
export function flatten(xs: RawArray, depth: number): RawArray {
  const arr = [];
  function flatten2(ys: RawArray, n: number) {
    for (let i = 0, len = ys.length; i < len; i++) {
      if (isArray(ys[i]) && (n > 0 || n < 0)) {
        flatten2(ys[i] as RawArray, Math.max(-1, n - 1));
      } else {
        arr.push(ys[i]);
      }
    }
  }
  flatten2(xs, depth);
  return arr;
}

/**
 * Determine whether two values are the same or strictly equivalent
 *
 * @param  {*}  a The first value
 * @param  {*}  b The second value
 * @return {Boolean}   Result of comparison
 */
export function isEqual(a: AnyVal, b: AnyVal): boolean {
  const lhs = [a];
  const rhs = [b];

  while (lhs.length > 0) {
    a = lhs.pop();
    b = rhs.pop();

    // strictly equal must be equal.
    if (a === b) continue;

    // unequal types and functions cannot be equal.
    const nativeType = getType(a).toLowerCase();
    if (
      nativeType !== getType(b).toLowerCase() ||
      nativeType === JsType.FUNCTION
    ) {
      return false;
    }

    // leverage toString for Date and RegExp types
    if (nativeType === JsType.ARRAY) {
      const xs = a as RawArray;
      const ys = b as RawArray;
      if (xs.length !== ys.length) return false;
      if (xs.length === ys.length && xs.length === 0) continue;
      into(lhs, xs);
      into(rhs, ys);
    } else if (nativeType === JsType.OBJECT) {
      // deep compare objects
      const ka = Object.keys(a);
      const kb = Object.keys(b);

      // check length of keys early
      if (ka.length !== kb.length) return false;

      // we know keys are strings so we sort before comparing
      ka.sort();
      kb.sort();

      // compare keys
      for (let i = 0, len = ka.length; i < len; i++) {
        const tempKey = ka[i];
        if (tempKey !== kb[i]) {
          return false;
        } else {
          // save later work
          lhs.push(a[tempKey]);
          rhs.push(b[tempKey]);
        }
      }
    } else {
      // compare encoded values
      if (encode(a) !== encode(b)) return false;
    }
  }
  return lhs.length === 0;
}

/**
 * Return a new unique version of the collection
 * @param  {Array} xs The input collection
 * @return {Array}    A new collection with unique values
 */
export function unique(xs: RawArray, hashFunction: HashFunction): RawArray {
  const h = {};
  const arr = [];
  for (const item of xs) {
    const k = hashCode(item, hashFunction);
    if (!has(h, k)) {
      arr.push(item);
      h[k] = 0;
    }
  }
  return arr;
}

/**
 * Encode value to string using a simple non-colliding stable scheme.
 *
 * @param value
 * @returns {*}
 */
function encode(value: AnyVal): string {
  const type = getType(value).toLowerCase();
  switch (type) {
    case JsType.BOOLEAN:
    case JsType.NUMBER:
    case JsType.REGEXP:
      return value.toString();
    case JsType.STRING:
      return JSON.stringify(value);
    case JsType.DATE:
      return (value as Date).toISOString();
    case JsType.NULL:
    case JsType.UNDEFINED:
      return type;
    case JsType.ARRAY:
      return "[" + (value as RawArray).map(encode).join(",") + "]";
    default:
      break;
  }
  // default case
  const prefix = type === JsType.OBJECT ? "" : `${getType(value)}`;
  const objKeys = Object.keys(value);
  objKeys.sort();
  return (
    `${prefix}{` +
    objKeys.map((k) => `${encode(k)}:${encode(value[k])}`).join(",") +
    "}"
  );
}

/**
 * Generate hash code
 * This selected function is the result of benchmarking various hash functions.
 * This version performs well and can hash 10^6 documents in ~3s with on average 100 collisions.
 *
 * @param value
 * @returns {number|null}
 */
export function hashCode(
  value: AnyVal,
  hashFunction: HashFunction = DEFAULT_HASH_FUNC
): string | null {
  if (isNil(value)) return null;

  return hashFunction(value);
}

/**
 * Default compare function
 * @param {*} a
 * @param {*} b
 */
export function compare(a: AnyVal, b: AnyVal): CompareResult {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
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
export function sortBy(
  collection: RawArray,
  keyFn: Callback<AnyVal>,
  comparator?: Comparator<AnyVal>
): RawArray {
  const sorted = new Array<string>();
  const result = new Array<AnyVal>();
  const hash: Record<string, RawArray> = {};
  comparator = comparator || compare;

  if (isEmpty(collection)) return collection;

  for (let i = 0; i < collection.length; i++) {
    const obj = collection[i];

    let key = keyFn(obj, i) as string;

    // objects with nil keys will go in first
    if (isNil(key)) {
      result.push(obj);
    } else {
      // null suffix to differentiate string keys from native object properties
      if (isString(key)) key += "\0";

      if (hash[key]) {
        hash[key].push(obj);
      } else {
        hash[key] = [obj];
      }
      sorted.push(key);
    }
  }

  // use native array sorting but enforce stableness
  sorted.sort(comparator);

  for (let i = 0; i < sorted.length; i++) {
    into(result, hash[sorted[i]]);
  }

  return result;
}

/**
 * Groups the collection into sets by the returned key
 *
 * @param collection
 * @param keyFn {Function} to compute the group key of an item in the collection
 * @returns {{keys: Array, groups: Array}}
 */
export function groupBy(
  collection: RawArray,
  keyFn: Callback<AnyVal>,
  hashFunction: HashFunction
): { keys: RawArray; groups: RawArray } {
  const result = {
    keys: new Array<AnyVal>(),
    groups: new Array<RawArray>(),
  };

  const lookup: Record<string, number> = {};

  for (const obj of collection) {
    const key = keyFn(obj);
    const hash = hashCode(key, hashFunction);
    let index = -1;

    if (lookup[hash] === undefined) {
      index = result.keys.length;
      lookup[hash] = index;
      result.keys.push(key);
      result.groups.push([]);
    }

    index = lookup[hash];
    result.groups[index].push(obj);
  }

  return result;
}

// max elements to push.
// See argument limit https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
const MAX_ARRAY_PUSH = 50000;

/**
 * Merge elements into the dest
 *
 * @param {*} target The target object
 * @param {*} rest The array of elements to merge into dest
 */
export function into(
  target: ArrayOrObject,
  ...rest: Array<ArrayOrObject>
): ArrayOrObject {
  if (target instanceof Array) {
    return rest.reduce((acc, arr: RawArray) => {
      // push arrary in batches to handle large inputs
      let i = Math.ceil(arr.length / MAX_ARRAY_PUSH);
      let begin = 0;
      while (i-- > 0) {
        Array.prototype.push.apply(
          acc,
          arr.slice(begin, begin + MAX_ARRAY_PUSH)
        );
        begin += MAX_ARRAY_PUSH;
      }
      return acc;
    }, target);
  } else if (isObject(target)) {
    // merge objects. same behaviour as Object.assign
    return rest.filter(isObjectLike).reduce((acc, item) => {
      Object.assign(acc, item);
      return acc;
    }, target);
  }

  return null;
}

/**
 * This is a generic memoization function
 *
 * This implementation uses a cache independent of the function being memoized
 * to allow old values to be garbage collected when the memoized function goes out of scope.
 *
 * @param {*} fn The function object to memoize
 */
export function memoize(
  fn: Callback<AnyVal>,
  hashFunction: HashFunction
): Callback<AnyVal> {
  return ((memo: RawObject) => {
    return (...args: RawArray): AnyVal => {
      const key = hashCode(args, hashFunction);
      if (!has(memo, key)) {
        memo[key] = fn.apply(this, args) as AnyVal;
      }
      return memo[key];
    };
  })({
    /* storage */
  });
}

// mingo internal

/**
 * Retrieve the value of a given key on an object
 * @param obj
 * @param key
 * @returns {*}
 * @private
 */
function getValue(obj: ArrayOrObject, key: string | number): AnyVal {
  return isObjectLike(obj) ? obj[key] : undefined;
}

/**
 * Unwrap a single element array to specified depth
 * @param {Array} arr
 * @param {Number} depth
 */
function unwrap(arr: RawArray, depth: number): RawArray {
  if (depth < 1) return arr;
  while (depth-- && arr.length === 1) arr = arr[0] as RawArray;
  return arr;
}

/**
 * Resolve the value of the field (dot separated) on the given object
 * @param obj {Object} the object context
 * @param selector {String} dot separated path to field
 * @returns {*}
 */
export function resolve(
  obj: ArrayOrObject,
  selector: string,
  options?: ResolveOptions
): AnyVal {
  let depth = 0;

  // options
  options = options || { unwrapArray: false };

  function resolve2(o: ArrayOrObject, path: Array<string>): AnyVal {
    let value: AnyVal = o;
    for (let i = 0; i < path.length; i++) {
      const field = path[i];
      const isText = /^\d+$/.exec(field) === null;

      // using instanceof to aid typescript compiler
      if (isText && value instanceof Array) {
        // On the first iteration, we check if we received a stop flag.
        // If so, we stop to prevent iterating over a nested array value
        // on consecutive object keys in the selector.
        if (i === 0 && depth > 0) break;

        depth += 1;
        // only look at the rest of the path
        const subpath = path.slice(i);
        value = value.reduce<RawArray>((acc: RawArray, item: ArrayOrObject) => {
          const v = resolve2(item, subpath);
          if (v !== undefined) acc.push(v);
          return acc;
        }, []);
        break;
      } else {
        value = getValue(value as ArrayOrObject, field);
      }
      if (value === undefined) break;
    }
    return value;
  }

  const result = inArray(JS_SIMPLE_TYPES, getType(obj).toLowerCase())
    ? obj
    : resolve2(obj, selector.split("."));

  return result instanceof Array && options.unwrapArray
    ? unwrap(result, depth)
    : result;
}

/**
 * Returns the full object to the resolved value given by the selector.
 * This function excludes empty values as they aren't practically useful.
 *
 * @param obj {Object} the object context
 * @param selector {String} dot separated path to field
 */
export function resolveGraph(
  obj: ArrayOrObject,
  selector: string,
  options?: ResolveOptions
): ArrayOrObject {
  // options
  if (options === undefined) {
    options = { preserveMissing: false };
  }

  const names: string[] = selector.split(".");
  const key = names[0];
  // get the next part of the selector
  const next = names.slice(1).join(".");
  const isIndex = /^\d+$/.exec(key) !== null;
  const hasNext = names.length > 1;
  let result: AnyVal;
  let value: AnyVal;

  if (obj instanceof Array) {
    if (isIndex) {
      result = getValue(obj, Number(key)) as ArrayOrObject;
      if (hasNext) {
        result = resolveGraph(result as ArrayOrObject, next, options);
      }
      result = [result];
    } else {
      result = [];
      for (const item of obj) {
        value = resolveGraph(item as ArrayOrObject, selector, options);
        if (options.preserveMissing) {
          if (value === undefined) {
            value = MISSING;
          }
          (result as RawArray).push(value);
        } else if (value !== undefined) {
          (result as RawArray).push(value);
        }
      }
    }
  } else {
    value = getValue(obj, key);
    if (hasNext) {
      value = resolveGraph(value as ArrayOrObject, next, options);
    }
    if (value === undefined) return undefined;
    result = {};
    result[key] = value;
  }

  return result as ArrayOrObject;
}

/**
 * Filter out all MISSING values from the object in-place
 *
 * @param obj The object to filter
 */
export function filterMissing(obj: ArrayOrObject): void {
  if (obj instanceof Array) {
    for (let i = obj.length - 1; i >= 0; i--) {
      if (obj[i] === MISSING) {
        obj.splice(i, 1);
      } else {
        filterMissing(obj[i] as ArrayOrObject);
      }
    }
  } else if (isObject(obj)) {
    for (const k in obj) {
      if (has(obj, k)) {
        filterMissing(obj[k] as ArrayOrObject);
      }
    }
  }
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
export function traverse(
  obj: ArrayOrObject,
  selector: string,
  fn: Callback<void>,
  force?: boolean
): void {
  const names = selector.split(".");
  const key = names[0];
  const next = names.slice(1).join(".");

  if (names.length === 1) {
    fn(obj, key);
  } else {
    // force the rest of the graph while traversing
    if (force === true && isNil(obj[key])) {
      obj[key] = {};
    }
    traverse(obj[key], next, fn, force);
  }
}

/**
 * Set the value of the given object field
 *
 * @param obj {Object|Array} the object context
 * @param selector {String} path to field
 * @param value {*} the value to set
 */
export function setValue(
  obj: RawObject,
  selector: string,
  value: AnyVal
): void {
  traverse(
    obj,
    selector,
    (item: RawObject, key: string) => {
      item[key] = value;
    },
    true
  );
}

/**
 * Removes an element from the container.
 * If the selector resolves to an array and the leaf is a non-numeric key,
 * the remove operation will be performed on objects of the array.
 *
 * @param obj {ArrayOrObject} object or array
 * @param selector {String} dot separated path to element to remove
 */
export function removeValue(obj: ArrayOrObject, selector: string): void {
  traverse(obj, selector, (item: AnyVal, key: string) => {
    if (item instanceof Array) {
      if (/^\d+$/.test(key)) {
        item.splice(parseInt(key), 1);
      } else {
        for (const elem of item) {
          if (isObject(elem)) {
            delete (elem as RawObject)[key];
          }
        }
      }
    } else if (isObject(item)) {
      delete item[key];
    }
  });
}

const OPERATOR_NAME_PATTERN = /^\$[a-zA-Z0-9_]+$/;
/**
 * Check whether the given name passes for an operator. We assume AnyVal field name starting with '$' is an operator.
 * This is cheap and safe to do since keys beginning with '$' should be reserved for internal use.
 * @param {String} name
 */
export function isOperator(name: string): boolean {
  return OPERATOR_NAME_PATTERN.test(name);
}

/**
 * Simplify expression for easy evaluation with query operators map
 * @param expr
 * @returns {*}
 */
export function normalize(expr: AnyVal): AnyVal {
  // normalized primitives
  if (inArray(JS_SIMPLE_TYPES, getType(expr).toLowerCase())) {
    return isRegExp(expr) ? { $regex: expr } : { $eq: expr };
  }

  // normalize object expression. using ObjectLike handles custom types
  if (isObjectLike(expr)) {
    // no valid query operator found, so we do simple comparison
    if (!Object.keys(expr).some(isOperator)) {
      return { $eq: expr };
    }

    // ensure valid regex
    if (has(expr as RawObject, "$regex")) {
      expr["$regex"] = new RegExp(expr["$regex"], expr["$options"]);
      delete expr["$options"];
    }
  }

  return expr;
}
