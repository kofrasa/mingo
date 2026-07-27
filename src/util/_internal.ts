/**
 * Utility constants and functions
 */
import { Any, AnyObject, ArrayOrObject, Callback, Comparator } from "../types";
import { hashCode } from "./_hash";

export { hashCode } from "./_hash";

/** Represents an error reported by the mingo library. */
export class MingoError extends Error {}

// special value to identify missing items. treated differently from undefined
export const MISSING = Symbol("missing");
const ERR_CYCLE_FOUND = "mingo: cycle detected while processing object/array";

type Constructor = new (...args: Any[]) => Any;

export const isPrimitive = (v: Any): boolean =>
  (typeof v !== "object" && typeof v !== "function") || v === null;

/** Scalar types provided by the JS runtime. Includes primitives, RegExp, and Date */
const isScalar = (v: Any) => isPrimitive(v) || isDate(v) || isRegExp(v);

/** MongoDB sort comparison order. https://www.mongodb.com/docs/manual/reference/bson-type-comparison-order */
const SORT_ORDER: Record<string, number> = {
  undefined: 1,
  null: 2,
  number: 3,
  string: 4,
  symbol: 5,
  object: 6,
  array: 7,
  arraybuffer: 8,
  boolean: 9,
  date: 10,
  regexp: 11,
  function: 12
};

type Cmp = string | number | boolean;
export const simpleCmp = <T = Cmp>(a: T, b: T) => (a < b ? -1 : a > b ? 1 : 0);
const typedArraysCmp = (a: ArrayBufferView, b: ArrayBufferView): number => {
  const bytesA = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  const bytesB = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
  const size = Math.min(bytesA.length, bytesB.length);
  // Compare byte by byte
  for (let i = 0; i < size; i++) {
    const order = simpleCmp(bytesA[i], bytesB[i]);
    if (order !== 0) return order;
  }
  return simpleCmp(bytesA.length, bytesB.length);
};

function mingoCmp(a: Any, b: Any, descendArray: boolean = false): number {
  if (a === MISSING) a = undefined;
  if (b === MISSING) b = undefined;
  // null, undefined, same object ref, same primitive value
  if (a === b || Object.is(a, b)) return 0;

  const typeA = typeOf(a);
  const typeB = typeOf(b);
  // capture "not equal" result to use in if-expressions when order evaluates to 1 or -1.
  let neq = 0;

  if (typeA === typeB) {
    switch (typeA) {
      case "number":
      case "string":
      case "boolean":
        return simpleCmp(a as Cmp, b as Cmp);
      case "date":
        return simpleCmp(+(a as Date), +(b as Date));
      case "regexp":
        if ((neq = simpleCmp((a as RegExp).source, (b as RegExp).source)))
          return neq;
        return simpleCmp((a as RegExp).flags, (b as RegExp).flags);
      case "arraybuffer":
        return typedArraysCmp(a as ArrayBufferView, b as ArrayBufferView);
      case "array": {
        const xs = (a as Any[]).slice().sort(mingoCmp);
        const ys = (b as Any[]).slice().sort(mingoCmp);
        const size = Math.min(xs.length, ys.length);
        for (let i = 0; i < size; i++)
          if ((neq = mingoCmp(xs[i], ys[i]))) return neq;
        return simpleCmp(xs.length, ys.length);
      }
      default: {
        if (typeA !== "object") {
          // short-cut when objects are the same type and have toString().
          if (a?.constructor === b?.constructor && hasCustomString(a))
            return simpleCmp((a as Str).toString(), (b as Str).toString());
        }
        // plain objects
        const keysA = Object.keys(a as object).sort();
        const keysB = Object.keys(b as object).sort();
        if ((neq = mingoCmp(keysA, keysB))) return neq;
        for (const k of keysA)
          if ((neq = mingoCmp((a as AnyObject)[k], (b as AnyObject)[k])))
            return neq;
        return 0;
      }
    }
  }

  // undefined is smallest, empty array is next smallest.
  if (typeA == "undefined") return -1;
  if (typeB == "undefined") return 1;
  if (descendArray) {
    if (typeA == "array") {
      const xs = a as Any[];
      if (!xs.length) return -1;
      const sorted = xs.slice().sort(mingoCmp);
      neq = 1;
      for (const v of sorted)
        if ((neq = Math.min(neq, mingoCmp(v, b))) < 0) return neq;
      return neq;
    }
    if (typeB == "array") {
      const ys = b as Any[];
      if (!ys.length) return 1;
      const sorted = ys.slice().sort(mingoCmp);
      neq = -1;
      for (const v of sorted)
        if ((neq = Math.max(neq, mingoCmp(a, v))) > 0) return neq;
      return neq;
    }
  }

  const orderA = SORT_ORDER[typeA] ?? Number.MAX_VALUE;
  const orderB = SORT_ORDER[typeB] ?? Number.MAX_VALUE;
  return orderA !== orderB
    ? simpleCmp(orderA, orderB)
    : simpleCmp(typeA, typeB);
}

/**
 * Compare function which adheres to MongoDB comparison order.
 *
 * @param a The first value
 * @param b The second value
 * @returns {Number}
 */
export const compare = (a: Any, b: Any): number => mingoCmp(a, b, true);

type Stringer = { toString(): string };
const hasCustomString = (o: Any): o is Stringer =>
  o !== null && o !== undefined && o["toString"] !== Object.prototype.toString;

type Str = { toString: () => string };

/**
 * Determine whether two values are the same or strictly equivalent.
 * Checking whether values are the same only applies to built in objects.
 * For custom objects, they are equal only of their toString() representation are equal if defined.
 *
 * @param a The first value
 * @param b The second value
 * @return True if values are equivalent, false otherwise.
 */
export function isEqual(a: Any, b: Any): boolean {
  // strictly equal must be equal. matches referentially equal values.
  if (a === b || Object.is(a, b)) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (a.constructor !== b?.constructor) return false;
  if (isDate(a)) return isDate(b) && +a === +b;
  if (isRegExp(a))
    return isRegExp(b) && a.source === b.source && a.flags === b.flags;
  if (isArray(a) && isArray(b)) {
    return a.length === b.length && a.every((v, i) => isEqual(v, b[i]));
  }
  if (a?.constructor !== Object && hasCustomString(a)) {
    return (a as Str)?.toString() === (b as Str)?.toString();
  }

  const objA = a as AnyObject;
  const objB = b as AnyObject;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(k => has(objB, k) && isEqual(objA[k], objB[k]));
}

/**
 * A map implementation that uses value comparison for keys instead of referential identity.
 *
 * IMPORTANT! we assume objects are never modified once the hash is computed and put in the Map.
 * Modifying an object after adding to the Map will cause incorrect behaviour.
 */
export class HashMap<K, V> extends Map<K, V> {
  // maps the hashcode to key set
  #keyMap = new Map<number, K[]>();
  // returns a tuple of [<masterKey>, <hash>]. Expects an object key.
  #unpack = (key: K): [K, number] => {
    const hash = hashCode(key);
    const items = this.#keyMap.get(hash) ?? [];
    return [items.find(k => isEqual(k, key)), hash] as [K, number];
  };

  private constructor() {
    super();
  }

  /**
   * Returns a new {@link HashMap} object.
   * @param fn An optional custom hash function
   */
  static init<K, V>() {
    return new HashMap<K, V>();
  }

  clear(): void {
    super.clear();
    this.#keyMap.clear();
  }

  delete(key: K): boolean {
    if (isPrimitive(key)) return super.delete(key);

    const [masterKey, hash] = this.#unpack(key);
    // nothing deleted
    if (!super.delete(masterKey)) return false;
    // filter out the deleted key
    this.#keyMap.set(
      hash,
      this.#keyMap.get(hash)!.filter(k => !isEqual(k, masterKey))
    );
    return true;
  }

  get(key: K): V | undefined {
    if (isPrimitive(key)) return super.get(key);

    const [masterKey, _] = this.#unpack(key);
    return super.get(masterKey);
  }

  has(key: K): boolean {
    if (isPrimitive(key)) return super.has(key);

    const [masterKey, _] = this.#unpack(key);
    return super.has(masterKey);
  }

  set(key: K, value: V): this {
    if (isPrimitive(key)) return super.set(key, value);

    const [masterKey, hash] = this.#unpack(key);
    if (super.has(masterKey)) {
      // replace masterKey value
      super.set(masterKey, value);
    } else {
      // add new master key.
      super.set(key, value);
      // cache against hash code.
      const keys = this.#keyMap.get(hash) || [];
      keys.push(key);
      // cache the key
      this.#keyMap.set(hash, keys);
    }
    return this;
  }

  /**
   * @returns the number of elements in the Map.
   */
  get size(): number {
    return super.size;
  }
}

export function assert(condition: Any, msg: string): void {
  if (!condition) throw new MingoError(msg);
}

export const assertNoProto = (s: string) => {
  if (
    s === "__proto__" ||
    s.startsWith("__proto__.") ||
    s.endsWith(".__proto__") ||
    s.includes(".__proto__.")
  ) {
    throw new MingoError(
      `Accessing __proto__ is not allowed in selector: '${s}'.`
    );
  }
};

/**
 * Returns the name of type in lowercase including custom types.
 * @param v Any value
 */
export function typeOf(v: Any): string {
  const t = typeof v;
  switch (t) {
    case "number":
    case "string":
    case "boolean":
    case "undefined":
    case "function":
    case "symbol":
      return t;
  }
  if (v === null) return "null";
  if (isArray(v)) return "array";
  if (isDate(v)) return "date";
  if (isRegExp(v)) return "regexp";
  if (isTypedArray(v)) return "arraybuffer";
  if (v?.constructor === Object) return "object";
  // native objects and custom types
  return v?.constructor?.name?.toLowerCase() ?? "object";
}
export const isBoolean = (v: Any): v is boolean => typeof v === "boolean";
export const isString = (v: Any): v is string => typeof v === "string";
export const isSymbol = (v: Any): boolean => typeof v === "symbol";
export const isNumber = (v: Any): v is number =>
  !Number.isNaN(v as number) && typeof v === "number";
export const isInteger = Number.isInteger;
export const isArray = Array.isArray;
export const isObject = (v: Any): v is AnyObject => typeOf(v) === "object";
//  objects, arrays, functions, date, custom object
export const isObjectLike = (v: Any): boolean => !isPrimitive(v);
export const isDate = (v: Any): v is Date => v instanceof Date;
export const isRegExp = (v: Any): v is RegExp => v instanceof RegExp;
export const isFunction = (v: Any): boolean => typeof v === "function";
export const isNil = (v: Any): v is undefined => v === null || v === undefined;
export const truthy = (arg: Any, strict = true): boolean =>
  !!arg || (strict && arg === "");
export const isEmpty = (x: Any): boolean =>
  isNil(x) ||
  (isString(x) && !x) ||
  (isArray(x) && x.length === 0) ||
  (isObject(x) && Object.keys(x).length === 0);
/** ensure a value is an array or wrapped within one. */
export const ensureArray = <T>(x: T | T[]): T[] => (isArray(x) ? x : [x]);

export const has = (
  obj: object,
  key1: string,
  key2: string = "",
  key3: string = ""
): boolean =>
  !!(
    obj &&
    Object.prototype.hasOwnProperty.call(obj, key1) &&
    (key2 === "" || Object.prototype.hasOwnProperty.call(obj, key2)) &&
    (key3 === "" || Object.prototype.hasOwnProperty.call(obj, key3))
  );

const isTypedArray = (v: Any): v is ArrayBuffer =>
  typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(v);

const isDigits = (s: string): boolean => {
  for (let i = 0; i < s.length; i++)
    if (s.charCodeAt(i) < 48 || s.charCodeAt(i) > 57) return false;
  return true;
};

/**
 * Deep clone an object.
 */
export const cloneDeep = <T>(v: T, refs?: WeakSet<object>): T => {
  if (isPrimitive(v)) return v;
  if (isDate(v)) return new Date(v) as T;
  if (isRegExp(v)) return new RegExp(v) as T;
  if (isTypedArray(v)) {
    const ctor = v.constructor as Constructor;
    return new ctor(v) as T;
  }
  if (!(refs instanceof WeakSet)) refs = new WeakSet();
  if (refs.has(v as object)) throw new Error(ERR_CYCLE_FOUND);
  refs.add(v as object);
  try {
    if (isArray(v)) {
      const arr = new Array<Any>(v.length);
      for (let i = 0; i < v.length; i++) arr[i] = cloneDeep(v[i], refs);
      return arr as T;
    }
    if (isObject(v)) {
      const obj: AnyObject = {};
      for (const k of Object.keys(v)) obj[k] = cloneDeep(v[k], refs);
      return obj as T;
    }
  } finally {
    refs.delete(v as object);
  }

  // custom-type. will be treated as immutable so return as is.
  return v;
};

/**
 * Returns the intersection of multiple arrays.
 *
 * @param  {Array} input An array of arrays from which to find intersection.
 * @return {Array} Array of intersecting values.
 */
export function intersection<T = Any>(input: T[][]): T[] {
  if (input.length === 0) return [];
  if (input.length === 1) return input[0].slice();
  for (const arr of input) if (arr.length === 0) return [];

  const maps = [HashMap.init<T, boolean>(), HashMap.init<T, boolean>()];
  let index = 0;
  // start with last array to ensure stableness.
  for (const v of input[input.length - 1]) maps[0].set(v, true);
  // process collection backwards.
  for (let i = input.length - 2; i >= 0; i--) {
    for (let j = 0; j < input[i].length; j++) {
      const v = input[i][j];
      if (maps[index].has(v)) maps[index ^ 1].set(v, true);
    }
    if (maps[index ^ 1].size === 0) return [];
    maps[index].clear();
    index = index ^ 1;
  }

  return Array.from(maps[index].keys());
}

/**
 * Flatten the array
 *
 * @param xs The array to flatten
 * @param depth The number of nested lists to iterate. @default 1
 */
export function flatten(xs: Any[], depth = 1): Any[] {
  const arr = new Array<Any>();
  function flatten2(ys: Any[], n: number) {
    for (let i = 0, len = ys.length; i < len; i++) {
      if (isArray(ys[i]) && (n > 0 || n < 0)) {
        flatten2(ys[i] as Any[], Math.max(-1, n - 1));
      } else {
        arr.push(ys[i]);
      }
    }
  }
  flatten2(xs, depth);
  return arr;
}

/**
 * Return a new unique version of the collection
 * @param  {Array} input The input collection
 * @return {Array}
 */
export function unique<T = Any>(input: T[]): T[] {
  const m = HashMap.init<T, boolean>();
  for (const v of input) m.set(v, true);
  return Array.from(m.keys());
}

/**
 * Groups the collection into sets by the returned key
 *
 * @param collection
 * @param keyFunc {Function} to compute the group key of an item in the collection
 */
export function groupBy<T = Any, K = Any>(
  collection: T[],
  keyFunc: (a: T, i: number) => K
): Map<K | null, T[]> {
  if (collection.length < 1) return new Map();

  // map of raw key values to matching objects of the same keyFn(obj).
  const result = HashMap.init<K | null, T[]>();
  for (let i = 0; i < collection.length; i++) {
    const obj = collection[i];
    const key = keyFunc(obj, i) ?? null;
    let a = result.get(key);
    if (!a) {
      a = [obj];
      result.set(key, a);
    } else {
      a.push(obj);
    }
  }
  return result;
}

export const OBJECT_PROTO_PROPS = new Set(
  Object.getOwnPropertyNames(Object.prototype).find(s => s !== "__proto__")!
);

/**
 * Retrieve the value of a given key on an object/array
 */
function getValue(obj: ArrayOrObject, key: string | number): Any {
  if (isPrimitive(obj) || Number.isNaN(key)) return undefined;
  // enforce array is only accessed with numeric keys.
  if (isArray(obj)) return obj[Number(key)];
  // enforce properties of Object.prototype are not accessed accidentally.
  return !OBJECT_PROTO_PROPS.has(key as string) || has(obj, key as string)
    ? (obj as AnyObject)[key]
    : undefined;
}

/**
 * Unwrap a single element array to specified depth
 * @param {Array} arr
 * @param {Number} depth
 * @private
 */
function unwrap(arr: Any[], depth: number): Any[] {
  if (depth < 1) return arr;
  while (depth-- && arr.length === 1 && isArray(arr[0])) arr = arr[0] as Any[];
  return arr;
}

/** Options to resolve() and resolveGraph() functions */
interface ResolveOptions {
  /** Unwrap the final array value.  */
  unwrapArray?: boolean;
  /** Preserve key/values for untouched keys in the subgraph. */
  preserveKeys?: boolean;
  /** Preserve indexes in arrays. When value is "missing", the special MISSING symbol is used for undefined values. */
  preserveIndex?: "default" | "missing";
  ignoreProto?: boolean;
}

/**
 * Resolve the value of the field (dot separated) on the given object
 * @param obj {AnyObject} the object context
 * @param selector {String} dot separated path to field
 */
export function resolve(
  obj: ArrayOrObject,
  selector: string,
  options?: Pick<ResolveOptions, "unwrapArray">
): Any {
  assertNoProto(selector);

  if (isScalar(obj)) return obj;

  // fast path for simple single-segment selectors on non-array objects (e.g., "active", "age")
  if (!selector.includes(".") && !isArray(obj)) return getValue(obj, selector);

  let depth = 0;

  function resolvePath(o: ArrayOrObject, path: string): Any {
    let value: Any = o;
    let begin = 0;
    let dot = 0;
    while (dot !== -1) {
      dot = path.indexOf(".", begin);
      const field =
        dot === -1 ? path.substring(begin) : path.substring(begin, dot);
      const isIndex = isDigits(field);
      if (!isIndex && isArray(value)) {
        // On the first iteration, we check if we received a stop flag.
        // If so, we stop to prevent iterating over a nested array value
        // on consecutive object keys in the selector.
        if (begin === 0 && depth > 0) break;
        depth += 1;
        // only look at the rest of the path
        const subpath = path.substring(begin);
        value = value.reduce<Any[]>((acc: Any[], item: ArrayOrObject) => {
          const v = resolvePath(item, subpath);
          if (v !== undefined) acc.push(v);
          return acc;
        }, []);
        break;
      } else {
        // always get by numeric index if target is an array.
        value = getValue(value as ArrayOrObject, field);
      }

      if (value === undefined) break;
      begin += field.length + 1;
    }

    return value;
  }

  const res = resolvePath(obj, selector);
  return isArray(res) && options?.unwrapArray ? unwrap(res, depth) : res;
}

/**
 * Returns the full object to the resolved value given by the selector.
 * When the target value is an array and the selctor is a non-numeric key, it is assumed the array contains objects and the selector is a field of those objects.
 * The options specified may be used to control how the subgraph is returned.
 *
 * @param obj {AnyObject} the object context
 * @param selector {String} dot separated path to field
 */
export function resolveGraph(
  obj: ArrayOrObject,
  selector: string,
  options: Omit<ResolveOptions, "unwrapArray">
): ArrayOrObject | undefined {
  if (options?.ignoreProto !== true) {
    assertNoProto(selector);
    options = { ...options, ignoreProto: true };
  }

  const sep = selector.indexOf(".");
  const key = sep == -1 ? selector : selector.substring(0, sep);
  const next = selector.substring(sep + 1);
  const hasNext = sep != -1;
  const { preserveIndex } = options;

  if (isArray(obj)) {
    const isIndex = isDigits(key);
    const arr = isIndex && preserveIndex === "default" ? obj.slice() : [];
    if (isIndex) {
      const index = Number(key);
      let value = getValue(obj, key) as ArrayOrObject;
      if (hasNext) value = resolveGraph(value, next, options)!;
      if (preserveIndex === "default") {
        arr[index] = value;
      } else {
        arr.push(value);
      }
    } else {
      for (let i = 0; i < obj.length; i++) {
        const value = resolveGraph(obj[i] as AnyObject, selector, options);
        if (preserveIndex === "missing") {
          arr.push(value ?? MISSING);
        } else if (value !== undefined || preserveIndex === "default") {
          arr.push(value);
        }
      }
    }
    return arr as ArrayOrObject;
  }

  const res = options?.preserveKeys ? { ...obj } : {};
  let value = getValue(obj, key);
  if (hasNext) {
    value = resolveGraph(value as ArrayOrObject, next, options);
  }
  if (value === undefined) return undefined;
  res[key] = value;
  return res;
}

/**
 * Filter out all MISSING values from the object in-place
 *
 * @param obj The object to filter
 * @private
 */
export function filterMissing(obj: ArrayOrObject): void {
  if (isArray(obj)) {
    for (let i = obj.length - 1; i >= 0; i--) {
      if (obj[i] === MISSING) {
        obj.splice(i, 1);
      } else {
        filterMissing(obj[i] as ArrayOrObject);
      }
    }
  } else if (isObject(obj)) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      filterMissing(obj[keys[i]] as ArrayOrObject);
    }
  }
}

/** Options passed to the walk function. */
export interface WalkOptions {
  buildGraph?: boolean;
  descendArray?: boolean;
  ignoreProto?: boolean;
}

export type Indexed = string | number;

/**
 * Walk the object graph and execute the given transform function
 *
 * @param  {AnyObject|Array} obj   The object to traverse.
 * @param  {String} selector    The selector to navigate.
 * @param  {Callback} fn Callback to execute for value at the end the traversal.
 * @param  {WalkOptions} options The opetions to use for the function.
 */
export function walk(
  obj: AnyObject,
  selector: string,
  fn: (_o: AnyObject, _k: string) => void,
  options?: WalkOptions
): void {
  if (options?.ignoreProto !== true) {
    assertNoProto(selector);
    options = { ...options, ignoreProto: true };
  }

  const dotIndex = selector.indexOf(".");
  const key = dotIndex === -1 ? selector : selector.substring(0, dotIndex);
  const next = selector.substring(key.length + 1);

  if (next.length === 0) {
    if (isObject(obj) || (isArray(obj) && isDigits(key))) fn(obj, key);
  } else {
    // force the rest of the graph while traversing
    if (options?.buildGraph && isNil(obj[key])) obj[key] = {};

    // get the next item
    const item = obj[key] as AnyObject;
    // nothing more to do
    if (!item) return;
    // we peek to see if next key is an array index.
    const nextDotIndex = next.indexOf(".");
    const nextKey =
      nextDotIndex === -1 ? next : next.substring(0, nextDotIndex);
    const isNextArrayIndex = isDigits(nextKey);
    // if we have an array value but the next key is not an index and the 'descendArray' option is set,
    // we walk each item in the array separately. This allows for handling traversing keys for objects
    // nested within an array.
    //
    // Eg: Given { array: [ {k:1}, {k:2}, {k:3} ] }
    //  - individual objecs can be traversed with "array.k"
    //  - a specific object can be traversed with "array.1"
    if (isArray(item) && options?.descendArray && !isNextArrayIndex) {
      for (let i = 0; i < item.length; i++)
        walk(item[i] as AnyObject, next, fn, options);
    } else {
      walk(item, next, fn, options);
    }
  }
}

/**
 * Set the value of the given object field
 *
 * @param obj {AnyObject|Array} the object context
 * @param selector {String} path to field
 * @param value {*} the value to set.
 */
export function setValue(obj: AnyObject, selector: string, value: Any): void {
  walk(obj, selector, (item: AnyObject, key: Indexed) => (item[key] = value), {
    buildGraph: true
  });
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
  obj: AnyObject,
  selector: string,
  options?: Pick<WalkOptions, "descendArray">
): void {
  walk(
    obj,
    selector,
    ((item: ArrayOrObject, key: string) => {
      if (isArray(item)) {
        item.splice(Number(key), 1);
      } else {
        delete item[key];
      }
    }) as Callback<void>,
    options
  );
}

/**
 * Check whether the given name passes for an operator. We assume AnyVal field name starting with '$' is an operator.
 * This is cheap and safe to do since keys beginning with '$' should be reserved for internal use.
 * @param {String} name
 */
export const isOperator = (name: string): boolean =>
  !!name && name[0] === "$" && /^\$[a-zA-Z0-9_]+$/.test(name);

/**
 * Simplify expression for easy evaluation with query operators map
 * @param expr
 * @returns {*}
 */
export function normalize(expr: Any): Any {
  if (isScalar(expr)) {
    return isRegExp(expr) ? { $regex: expr } : { $eq: expr };
  }

  // normalize object expression. using ObjectLike handles custom types
  // no valid query operator found, so we do simple comparison
  if (!Object.keys(expr as AnyObject).some(isOperator)) return { $eq: expr };
  // ensure valid regex
  if (isObject(expr) && has(expr, "$regex")) {
    const newExpr = { ...expr };
    newExpr["$regex"] = new RegExp(
      expr["$regex"] as string,
      expr["$options"] as string
    );
    delete newExpr["$options"];
    return newExpr;
  }

  return expr;
}

/**
 * Find the insert index for the given key in a sorted array.
 *
 * @param sorted The sorted array to search
 * @param item The search key
 * @param comparator Optional custom compare function
 */
export function findInsertIndex<T = Any>(
  sorted: T[],
  item: T,
  comparator: Comparator<T> = compare
): number {
  // uses binary search
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = Math.round(lo + (hi - lo) / 2);
    if (comparator(item, sorted[mid]) < 0) {
      hi = mid - 1;
    } else if (comparator(item, sorted[mid]) > 0) {
      lo = mid + 1;
    } else {
      return mid;
    }
  }
  return lo;
}

interface PathNode {
  children: Map<string, PathNode>;
  isTerminal: boolean;
}

/** Simple trie for validating path conflicts */
export class PathValidator {
  private root: PathNode;

  constructor() {
    this.root = {
      children: new Map<string, PathNode>(),
      isTerminal: false
    };
  }

  add(selector: string): boolean {
    const parts = selector.split(".");
    let current = this.root;

    for (const part of parts) {
      if (current.isTerminal) return false;

      if (!current.children.has(part)) {
        current.children.set(part, {
          children: new Map<string, PathNode>(),
          isTerminal: false
        });
      }

      current = current.children.get(part)!;
    }
    // selector path already exists (i.e. either terminal or has children)
    if (current.isTerminal || current.children.size) return false;
    return (current.isTerminal = true);
  }
}
