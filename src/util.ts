/**
 * Utility constants and functions
 */

import {
  AnyVal,
  ArrayOrObject,
  Callback,
  Comparator,
  HashFunction,
  JsType,
  RawArray,
  RawObject,
} from "./types";

export const MAX_INT = 2147483647;
export const MIN_INT = -2147483648;
export const MAX_LONG = Number.MAX_SAFE_INTEGER;
export const MIN_LONG = Number.MIN_SAFE_INTEGER;

// special value to identify missing items. treated differently from undefined
const MISSING = Symbol("missing");

/**
 * Uses the simple hash method as described in Effective Java.
 * @see https://stackoverflow.com/a/113600/1370481
 * @param value The value to hash
 * @returns {number}
 */
const DEFAULT_HASH_FUNCTION: HashFunction = (value: AnyVal): number => {
  const s = stringify(value);
  let hash = 0;
  let i = s.length;
  while (i) hash = ((hash << 5) - hash) ^ s.charCodeAt(--i);
  return hash >>> 0;
};

/** Options to resolve() and resolveGraph() functions */
interface ResolveOptions {
  unwrapArray?: boolean;
  preserveMissing?: boolean;
  preserveKeys?: boolean;
}

// no array, object, or function types
const JS_SIMPLE_TYPES = new Set<JsType>([
  "null",
  "undefined",
  "boolean",
  "number",
  "string",
  "date",
  "regexp",
]);

/** MongoDB sort comparison order. https://www.mongodb.com/docs/manual/reference/bson-type-comparison-order */
const SORT_ORDER_BY_TYPE: Record<JsType, number> = {
  null: 0,
  undefined: 0,
  number: 1,
  string: 2,
  object: 3,
  array: 4,
  boolean: 5,
  date: 6,
  regexp: 7,
  function: 8,
};

/**
 * Compare function which adheres to MongoDB comparison order.
 *
 * @param a The first value
 * @param b The second value
 * @returns {Number}
 */
export const DEFAULT_COMPARATOR = (a: AnyVal, b: AnyVal): number => {
  if (a === MISSING) a = undefined;
  if (b === MISSING) b = undefined;
  const u = SORT_ORDER_BY_TYPE[getType(a).toLowerCase() as JsType];
  const v = SORT_ORDER_BY_TYPE[getType(b).toLowerCase() as JsType];
  if (u !== v) return u - v;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

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
  return OBJECT_TYPE_RE.exec(Object.prototype.toString.call(v) as string)[1];
}
export function isBoolean(v: AnyVal): v is boolean {
  return typeof v === "boolean";
}
export function isString(v: AnyVal): v is string {
  return typeof v === "string";
}
export function isNumber(v: AnyVal): v is number {
  return !isNaN(v as number) && typeof v === "number";
}
export const isArray = Array.isArray;
export function isObject(v: AnyVal): v is object {
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
  return typeof v === "function";
}
export function isNil(v: AnyVal): boolean {
  return v === null || v === undefined;
}
export function inArray(arr: AnyVal[], item: AnyVal): boolean {
  return arr.includes(item);
}
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
export function isMissing(m: AnyVal): boolean {
  return m === MISSING;
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

/** Options to merge function */
interface MergeOptions {
  readonly flatten?: boolean;
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
  if (isMissing(target)) return obj;
  if (isMissing(obj)) return target;

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
        result.push(obj[j++] as ArrayOrObject);
      }
    } else {
      into(result, input);
    }
  } else {
    Object.keys(obj).forEach((k) => {
      if (has(obj as RawObject, k)) {
        if (has(target, k)) {
          target[k] = merge(
            target[k] as ArrayOrObject,
            obj[k] as ArrayOrObject,
            options
          );
        } else {
          target[k] = obj[k] as AnyVal;
        }
      }
    });
  }

  return target;
}

// A tree to support O(logN) search
interface BNode {
  left?: BNode;
  right?: BNode;
  readonly key: string;
  readonly indexes: number[];
}

function addIndex(root: BNode, key: string, index: number) {
  if (root.key < key) {
    if (root.right) {
      addIndex(root.right, key, index);
    } else {
      root.right = { key, indexes: [index] } as BNode;
    }
  } else if (root.key > key) {
    if (root.left) {
      addIndex(root.left, key, index);
    } else {
      root.left = { key, indexes: [index] } as BNode;
    }
  } else {
    root.indexes.push(index);
  }
}

function getIndexes(root: BNode, key: string): number[] | undefined {
  if (root.key == key) {
    return root.indexes;
  } else if (root.key < key) {
    return root.right ? getIndexes(root.right, key) : undefined;
  } else if (root.key > key) {
    return root.left ? getIndexes(root.left, key) : undefined;
  }
  return undefined;
}

/**
 * Returns the intersection of multiple arrays.
 *
 * @param  {Array} a The first array
 * @param  {Array} b The second array
 * @param  {Function} hashFunction Custom function to hash values, default the hashCode method
 * @return {Array}    Result array
 */
export function intersection(
  input: RawArray[],
  hashFunction: HashFunction = DEFAULT_HASH_FUNCTION
): RawArray {
  // if any array is empty, there is no intersection
  if (input.some((arr) => arr.length == 0)) return [];

  // sort input arrays by size
  const sortedIndex = input.map((a, i) => [i, a.length]);
  sortedIndex.sort((a, b) => a[1] - b[1]);

  // matched items index of first array for all other arrays.
  const result: Array<Record<number, boolean>> = [];

  const smallestArray = input[sortedIndex[0][0]];
  const root: BNode = {
    key: hashCode(smallestArray[0], hashFunction),
    indexes: [0],
  };

  for (let i = 1; i < smallestArray.length; i++) {
    const val = smallestArray[i];
    const h = hashCode(val, hashFunction);
    addIndex(root, h, i);
  }

  let maxResultSize = sortedIndex[0][1];
  const orderedIndexes: number[] = [];

  for (let i = 1; i < sortedIndex.length; i++) {
    const arrayIndex = sortedIndex[i][0];
    const data = input[arrayIndex];

    // number of matched items
    let size = 0;
    for (let j = 0; j < data.length; j++) {
      const h = hashCode(data[j], hashFunction);
      const indexes = getIndexes(root, h);

      // not included.
      if (!indexes) continue;

      // check items equality to mitigate hash collisions and select the matching index.
      const idx = indexes
        .map((n) => smallestArray[n])
        .findIndex((v) => isEqual(v, data[j]));

      // not included
      if (idx == -1) continue;

      // item matched. ensure map exist for marking index
      if (result.length < i) result.push({});

      // map to index of the actual value and set position
      result[result.length - 1][indexes[idx]] = true;

      // if we have seen max result items we can stop.
      size = Object.keys(result[result.length - 1]).length;

      // ensure stabilty
      if (arrayIndex == 0) {
        if (orderedIndexes.indexOf(indexes[idx]) == -1) {
          orderedIndexes.push(indexes[idx]);
        }
      }
    }
    // no intersection if nothing found
    if (size == 0) return [];

    // new max result size
    maxResultSize = Math.min(maxResultSize, size);
  }

  const freq: Record<number, number> = {};

  // count occurrences
  result.forEach((m) => {
    Object.keys(m).forEach((k) => {
      const n = parseFloat(k);
      freq[n] = freq[n] || 0;
      freq[n]++;
    });
  });

  const keys = orderedIndexes;

  if (keys.length == 0) {
    // note: cannot use parseInt due to second argument for radix.
    keys.push(...Object.keys(freq).map(parseFloat));
    keys.sort();
  }

  return keys
    .filter((n) => freq[n] == input.length - 1)
    .map((n) => smallestArray[n]);
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
    const nativeType = getType(a).toLowerCase() as JsType;
    if (nativeType !== getType(b).toLowerCase() || nativeType === "function") {
      return false;
    }

    // leverage toString for Date and RegExp types
    if (nativeType === "array") {
      const xs = a as RawArray;
      const ys = b as RawArray;
      if (xs.length !== ys.length) return false;
      if (xs.length === ys.length && xs.length === 0) continue;
      into(lhs, xs);
      into(rhs, ys);
    } else if (nativeType === "object") {
      // deep compare objects
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);

      // check length of keys early
      if (aKeys.length !== bKeys.length) return false;

      // compare keys
      for (let i = 0, len = aKeys.length; i < len; i++) {
        const k = aKeys[i];
        // not found
        if (!has(b as RawObject, k)) return false;
        // key found
        lhs.push(a[k]);
        rhs.push(b[k]);
      }
    } else {
      // compare encoded values
      if (stringify(a) !== stringify(b)) return false;
    }
  }
  return lhs.length === 0;
}

/**
 * Return a new unique version of the collection
 * @param  {Array} xs The input collection
 * @return {Array}
 */
export function unique(
  xs: RawArray,
  hashFunction: HashFunction = DEFAULT_HASH_FUNCTION
): RawArray {
  if (xs.length == 0) return [];

  const root: BNode = {
    key: hashCode(xs[0], hashFunction),
    indexes: [0],
  };

  // hash items on to tree to track collisions
  for (let i = 1; i < xs.length; i++) {
    addIndex(root, hashCode(xs[i], hashFunction), i);
  }

  const result: number[] = [];

  // walk tree and remove duplicates
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node.indexes.length == 1) {
      result.push(node.indexes[0]);
    } else {
      // handle collisions by matching all items
      const arr = node.indexes;
      // we start by search from the back so we maintain the smaller index when there is a duplicate.
      while (arr.length > 0) {
        for (let j = 1; j < arr.length; j++) {
          // if last item matches any remove the last item.
          if (isEqual(xs[arr[arr.length - 1]], xs[arr[arr.length - 1 - j]])) {
            // remove last item
            arr.pop();
            // reset position
            j = 0;
          }
        }
        // add the unique item
        result.push(arr.pop());
      }
    }

    // add children
    if (node.left) stack.push(node.left);
    if (node.right) stack.push(node.right);
  }

  // sort indexes for stability
  result.sort();

  // return the unique items
  return result.map((i) => xs[i]);
}

/**
 * Encode value to string using a simple non-colliding stable scheme.
 *
 * @param value
 * @returns {*}
 */
export function stringify(value: AnyVal): string {
  const type = getType(value).toLowerCase() as JsType;
  switch (type) {
    case "boolean":
    case "number":
    case "regexp":
      return value.toString();
    case "string":
      return JSON.stringify(value);
    case "date":
      return (value as Date).toISOString();
    case "null":
    case "undefined":
      return type;
    case "array":
      return "[" + (value as RawArray).map(stringify).join(",") + "]";
    default:
      break;
  }
  // default case
  const prefix = type === "object" ? "" : `${getType(value)}`;
  const objKeys = Object.keys(value);
  objKeys.sort();
  return (
    `${prefix}{` +
    objKeys.map((k) => `${stringify(k)}:${stringify(value[k])}`).join(",") +
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
  hashFunction: HashFunction = DEFAULT_HASH_FUNCTION
): string | null {
  if (isNil(value)) return null;
  return hashFunction(value).toString();
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
  comparator: Comparator<AnyVal> = DEFAULT_COMPARATOR
): RawArray {
  const sorted = [];
  const result = [];

  if (isEmpty(collection)) return collection;

  for (let i = 0; i < collection.length; i++) {
    const obj = collection[i];
    const key = keyFn(obj, i);
    if (isNil(key)) {
      result.push(obj);
    } else {
      sorted.push([key, obj]);
    }
  }

  // use native array sorting but enforce stableness
  sorted.sort((a: RawArray, b: RawArray) => comparator(a[0], b[0]));
  result.push(...sorted.map((o: RawArray) => o[1]));
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
  hashFunction: HashFunction = DEFAULT_HASH_FUNCTION
): { keys: RawArray; groups: RawArray[] } {
  const result = {
    keys: new Array<AnyVal>(),
    groups: new Array<RawArray>(),
  };

  const lookup: Record<string, number> = {};

  for (let i = 0; i < collection.length; i++) {
    const obj = collection[i];
    const key = keyFn(obj, i);
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
  } else {
    // merge objects. same behaviour as Object.assign
    return rest.filter(isObjectLike).reduce((acc, item) => {
      Object.assign(acc, item);
      return acc;
    }, target);
  }
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
  hashFunction: HashFunction = DEFAULT_HASH_FUNCTION
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

  const result = JS_SIMPLE_TYPES.has(getType(obj).toLowerCase() as JsType)
    ? obj
    : resolve2(obj, selector.split("."));

  return result instanceof Array && options?.unwrapArray
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
        if (options?.preserveMissing) {
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
    result = options?.preserveKeys ? { ...obj } : {};
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
 * @return {*}
 */
function walk(
  obj: ArrayOrObject,
  selector: string,
  fn: Callback<void>,
  options?: { buildGraph?: boolean }
): void {
  if (isNil(obj)) return;

  const names = selector.split(".");
  const key = names[0];
  const next = names.slice(1).join(".");

  if (names.length === 1) {
    fn(obj, key);
  } else {
    // force the rest of the graph while traversing
    if (options?.buildGraph === true && isNil(obj[key])) {
      obj[key] = {};
    }
    walk(obj[key] as ArrayOrObject, next, fn, options);
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
  walk(
    obj,
    selector,
    (item: RawObject, key: string) => {
      item[key] = value;
    },
    { buildGraph: true }
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
export function removeValue(
  obj: ArrayOrObject,
  selector: string,
  options?: { descendArray: boolean }
): void {
  walk(obj, selector, (item: AnyVal, key: string) => {
    if (item instanceof Array) {
      if (/^\d+$/.test(key)) {
        item.splice(parseInt(key), 1);
      } else if (options && options.descendArray) {
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
  if (JS_SIMPLE_TYPES.has(getType(expr).toLowerCase() as JsType)) {
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
      return {
        $regex: new RegExp(
          expr["$regex"] as string,
          expr["$options"] as string
        ),
      };
    }
  }

  return expr;
}
