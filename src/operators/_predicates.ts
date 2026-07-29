import { ComputeOptions, evalExpr } from "../core/_internal";
import { Query } from "../query";
import {
  Any,
  AnyObject,
  BsonType,
  Callback,
  JsType,
  Options,
  Predicate
} from "../types";
import {
  assert,
  compare as mingoCmp,
  ensureArray,
  flatten,
  intersection,
  isArray,
  isBoolean,
  isDate,
  isEqual,
  isInteger,
  isNil,
  isNumber,
  isObject,
  isOperator,
  isRegExp,
  isString,
  resolve,
  truthy,
  typeOf
} from "../util/_internal";

type ConversionType = number | Exclude<JsType, "function"> | BsonType;

/**
 * Builds a predicate for $elemMatch operator to remove repeated work required for each element in the array.
 * This includes pre-compiling the query and determining if we need to wrap non-objects in a temporary object.
 */
function elemMatchPredicate(criteria: AnyObject, options: Options) {
  // MongoDB parity: an empty $elemMatch matches arrays that contain
  // at least one document (object) element.
  if (Object.keys(criteria).length === 0) {
    return (v: Any) => isObject(v);
  }
  // precompute criteria and format function at query compilation time
  let format = (x: Any) => x;
  // determine if we need to wrap the criteria in a temporary key to avoid confusion with top-level operators.
  let wrap = true;
  for (const k of Object.keys(criteria)) {
    wrap &&= isOperator(k) && "$and" !== k && "$or" !== k && "$nor" !== k;
    if (!wrap) break;
  }
  if (wrap) {
    criteria = { field: criteria };
    format = x => ({ field: x });
  }
  // create query once, reuse for all documents
  const q = new Query(criteria, options);
  return (v: Any) => q.test(format(v) as AnyObject) as boolean;
}

export function processQuery(
  selector: string,
  value: Any,
  options: Options,
  predicate: Predicate
): (_: AnyObject) => boolean {
  let [begin, depth] = [-1, 0];
  while ((begin = selector.indexOf(".", begin + 1)) !== -1) depth++;
  const copts = ComputeOptions.init(options).update({ depth });
  const opts = { unwrapArray: true };
  if (predicate === $elemMatch) {
    value = elemMatchPredicate(value as AnyObject, options);
  }
  return (o: AnyObject): boolean => {
    // value of field must be fully resolved.
    const lhs = resolve(o, selector, opts);
    return predicate(lhs, value, copts);
  };
}

export function processExpression(
  obj: AnyObject,
  expr: Any,
  options: Options,
  predicate: Predicate
): boolean {
  assert(
    isArray(expr) && expr.length === 2,
    `${predicate.name} expects array(2)`
  );
  const [lhs, rhs] = evalExpr(obj, expr, options) as Any[];
  return predicate(lhs, rhs, options);
}

/**
 * Checks that two values are equal.
 */
export function $eq(a: Any, b: Any, options?: Options): boolean {
  // start with simple equality check
  if (isEqual(a, b)) return true;

  // https://docs.mongodb.com/manual/tutorial/query-for-null-fields/
  if (isNil(a) && isNil(b)) return true;

  // check
  if (isArray(a)) {
    const depth = (options as ComputeOptions)?.local?.depth ?? 1;
    return (
      a.some(v => isEqual(v, b)) || flatten(a, depth).some(v => isEqual(v, b))
    );
  }

  return false;
}

/**
 * Matches all values that are not equal to the value specified in the query.
 */
export function $ne(a: Any, b: Any, options?: Options): boolean {
  return !$eq(a, b, options);
}

/**
 * Matches any of the values that exist in an array specified in the query.
 */
export function $in(a: Any[], b: Any[], _options?: Options): boolean {
  // queries for null should be able to find undefined fields
  if (isNil(a)) return b.some(v => v === null);
  const values = ensureArray(a);
  if (intersection([values, b]).length > 0) return true;
  // MongoDB parity: a regular expression in the query array matches
  // string values as a pattern, in addition to equal regex values.
  // https://docs.mongodb.com/manual/reference/operator/query/in/
  const patterns = b.filter(isRegExp) as RegExp[];
  return (
    patterns.length > 0 &&
    values.some(v => isString(v) && patterns.some(re => re.test(v)))
  );
}

/**
 * Matches values that do not exist in an array specified to the query.
 */
export function $nin(a: Any[], b: Any[], options?: Options): boolean {
  return !$in(a, b, options);
}

/**
 * Matches values that are less than the value specified in the query.
 */
export function $lt(a: Any, b: Any, _options?: Options): boolean {
  return compare(a, b, (x: Any, y: Any) => mingoCmp(x, y) < 0);
}

/**
 * Matches values that are less than or equal to the value specified in the query.
 */
export function $lte(a: Any, b: Any, _options?: Options): boolean {
  return compare(a, b, (x: Any, y: Any) => mingoCmp(x, y) <= 0);
}

/**
 * Matches values that are greater than the value specified in the query.
 */
export function $gt(a: Any, b: Any, _options?: Options): boolean {
  return compare(a, b, (x: Any, y: Any) => mingoCmp(x, y) > 0);
}

/**
 * Matches values that are greater than or equal to the value specified in the query.
 */
export function $gte(a: Any, b: Any, _options?: Options): boolean {
  return compare(a, b, (x: Any, y: Any) => mingoCmp(x, y) >= 0);
}

/**
 * Performs a modulo operation on the value of a field and selects documents with a specified result.
 */
export function $mod(a: Any, b: number[], _options: Options): boolean {
  return ensureArray(a).some(
    ((x: number) => b.length === 2 && x % b[0] === b[1]) as Callback
  );
}

/**
 * Selects documents where values match a specified regular expression.
 */
export function $regex(a: Any, b: RegExp, options?: Options): boolean {
  const lhs = ensureArray(a) as string[];
  const match = (x: string) =>
    isString(x) && truthy(b.exec(x), options?.useStrictMode);
  return lhs.some(match) || flatten(lhs, 1).some(match as Callback);
}

/**
 * Matches arrays that contain all elements specified in the query.
 */
export function $all(
  values: Any[],
  rhs: AnyObject[],
  options: Options
): boolean {
  if (!isArray(values) || !isArray(rhs) || !values.length || !rhs.length) {
    return false;
  }

  let matched = true;
  for (const expr of rhs) {
    // no need to check all the queries.
    if (!matched) break;
    if (isObject(expr) && Object.keys(expr)[0] === "$elemMatch") {
      const criteria = expr["$elemMatch"] as AnyObject;
      const pred = elemMatchPredicate(criteria, options);
      matched = $elemMatch(values, pred, options);
    } else if (isRegExp(expr)) {
      matched = values.some(s => isString(s) && expr.test(s));
    } else {
      matched = values.some(v => isEqual(expr, v));
    }
  }
  return matched;
}

/**
 * Selects documents if the array field is a specified size.
 */
export function $size(a: Any[], b: number, _options?: Options): boolean {
  return Array.isArray(a) && a.length === b;
}

/**
 * Selects documents if element in the array field matches all the specified $elemMatch condition.
 */
export function $elemMatch(
  a: Any[],
  b: ReturnType<typeof elemMatchPredicate>,
  _options: Options
): boolean {
  // should return false for non-matching input
  if (isArray(a) && a.length !== 0) {
    for (let i = 0, len = a.length; i < len; i++) if (b(a[i])) return true;
  }
  return false;
}

// helper functions
const isNull = (a: Any) => a === null;

/** Mapping of type to predicate */
const compareFuncs: Record<ConversionType, Predicate> = {
  array: isArray,
  boolean: isBoolean,
  bool: isBoolean,
  date: isDate,
  number: isNumber,
  int: isInteger,
  long: isInteger,
  double: isNumber,
  decimal: isNumber,
  null: isNull,
  object: isObject,
  regexp: isRegExp,
  regex: isRegExp,
  string: isString,
  // added for completeness
  undefined: isNil, // deprecated
  // Mongo identifiers
  1: isNumber, //double
  2: isString,
  3: isObject,
  4: isArray as Predicate,
  6: isNil, // deprecated
  8: isBoolean,
  9: isDate,
  10: isNull,
  11: isRegExp,
  16: isInteger, //int
  18: isInteger, //long
  19: isNumber //decimal
};

/**
 * Selects documents if a field is of the specified type.
 */
function compareType(a: Any, b: ConversionType, _?: Options): boolean {
  const f = compareFuncs[b];
  return f ? f(a) : false;
}

/**
 * Selects documents if a field is of the specified type.
 */
export function $type(
  a: Any,
  b: ConversionType | ConversionType[],
  options?: Options
): boolean {
  return isArray(b)
    ? b.findIndex(t => compareType(a, t, options)) >= 0
    : compareType(a, b, options);
}

function compare(a: Any, b: Any, f: Predicate): boolean {
  for (const v of ensureArray(a)) {
    if (typeOf(v) === typeOf(b) && f(v, b)) return true;
  }
  return false;
}
