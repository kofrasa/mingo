import { ComputeOptions, Context } from "../../core/_internal";
import * as booleanOperators from "../../operators/expression/boolean";
import * as comparisonOperators from "../../operators/expression/comparison";
import * as queryOperators from "../../operators/query";
import { Query } from "../../query";
import { Any, AnyObject } from "../../types";
import {
  assert,
  assertNoProto,
  cloneDeep,
  isArray,
  isDate,
  isObject,
  isRegExp,
  PathValidator,
  resolve,
  walk,
  WalkOptions
} from "../../util/_internal";

export type SingleKeyRecord<K extends PropertyKey, V> = {
  [P in K]: Record<P, V>;
}[K];

export const DEFAULT_OPTIONS = ComputeOptions.init({
  context: Context.init()
    .addQueryOps(queryOperators)
    .addExpressionOps(booleanOperators)
    .addExpressionOps(comparisonOperators)
}).update({ updateConfig: { cloneMode: "copy" } });

export const clone = (val: Any, opts: ComputeOptions): Any => {
  const mode = opts?.local?.updateConfig?.cloneMode;
  switch (mode) {
    case "deep":
      return cloneDeep(val);
    case "copy": {
      if (isDate(val)) return new Date(val);
      if (isArray(val)) return (val as Any[]).slice();
      if (isObject(val)) return Object.assign({}, val);
      if (isRegExp(val)) return new RegExp(val);
      return val;
    }
  }
  return val;
};

export type PathNode = {
  /** The path to the array or field. Empty for an array directly nested in an array. */
  selector: string;
  position?: string;
  next?: PathNode;
  /** Returns the index that "$" stands for in a document, or -1. */
  matchFirst?: (doc: AnyObject) => number;
  /** The items selected in each array, resolved before the document is modified. */
  resolved?: WeakMap<Any[], number[]>;
};

// positional array specifier for first matching item.
const FIRST_ONLY = "$";
// positional array-wide specifier for all items in matching array.
const ARRAY_WIDE = "$[]";
const DIGITS = /^\d+$/;

const ERR_POSITIONAL_NO_MATCH =
  "The positional operator did not find the match needed from the query.";

/** Returns the indexes of the items of the array matched by the positional operator of the node. */
const matchIndexes = (
  arr: Any[],
  n: PathNode,
  q: Record<string, Query>,
  root: AnyObject
): number[] => {
  const c = n.position as string;
  if (c === FIRST_ONLY) {
    const i = n.matchFirst!(root);
    assert(i > -1 && i < arr.length, ERR_POSITIONAL_NO_MATCH);
    return [i];
  }
  const filter = c === ARRAY_WIDE ? undefined : q[c];
  const indexes: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    // filter if applicable.
    if (!filter || filter.test({ [c]: [arr[i]] })) indexes.push(i);
  }
  return indexes;
};

// returns whether a predicate can match without recording the array item it matched.
const isNegation = (v: Any): boolean =>
  isObject(v) &&
  (["$ne", "$nin", "$not"].some(op => op in v) || v.$exists === false);

/**
 * Creates the function returning the index that "$" stands for in a document. As on MongoDB,
 * this is the first match in the array traversed by the last predicate of the query in path
 * order, whichever array the selector updates. $nor and $or with several branches do not
 * record a match.
 */
const createMatchFirst = (condition: AnyObject, options: ComputeOptions) => {
  const predicates: [string, Any, string[]][] = [];
  const collect = (cond: AnyObject) => {
    for (const k of Object.keys(cond)) {
      const list = cond[k] as AnyObject[];
      if (k === "$and" || (k === "$or" && list.length === 1))
        list.forEach(collect);
      else if (k.startsWith("$")) continue;
      else if (!isNegation(cond[k]))
        predicates.push([k, cond[k], k.split(".")]);
    }
  };
  collect(condition);
  predicates.sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const queries = new Map<string, Query>();
  return (doc: AnyObject): number => {
    for (const [, value, parts] of predicates) {
      let cur: Any = doc;
      let j = 0;
      for (
        ;
        j < parts.length && !(isArray(cur) && !DIGITS.test(parts[j]));
        j++
      ) {
        cur =
          isArray(cur) || isObject(cur)
            ? (cur as AnyObject)[parts[j]]
            : undefined;
      }
      if (!isArray(cur)) continue;
      const field = ["e", ...parts.slice(j)].join(".");
      let query = queries.get(field);
      if (!query)
        queries.set(field, (query = new Query({ [field]: value }, options)));
      const i = cur.findIndex(e => query.test({ e: [e] }));
      if (i > -1) return i;
    }
    return -1;
  };
};

/**
 * Applies an update function to a value to produce a new value to modify an object in-place.
 * @param o The object or array to modify.
 * @param n The path node of the update selector.
 * @param q Map of positional identifiers to queries for filtering.
 * @param f The update function which accepts containver value and key.
 * @param opts The optional {@link WalkOptions} passed to the walk function.
 */
export const applyUpdate = (
  o: AnyObject,
  n: PathNode,
  q: Record<string, Query>,
  f: (_o: AnyObject, _k: string) => boolean,
  opts?: WalkOptions
): boolean => {
  const { selector, position: c, next } = n;
  if (!c) {
    // wrapper to collect status
    let b = false;
    const g: typeof f = (u, k) => (b = Boolean(f(u, k)) || b);
    walk(o, selector, g, opts);
    return b;
  }
  const arr = (selector ? resolve(o, selector) : o) as AnyObject;
  // no update applied if we do not get correct type.
  if (!isArray(arr) || !arr.length) return false;

  // apply update to matching items.
  let status = false;
  for (const i of n.resolved?.get(arr) ?? matchIndexes(arr, n, q, o)) {
    // apply update and track success.
    status = next
      ? applyUpdate(arr[i] as AnyObject, next, q, f, opts) || status
      : f(arr, i as Any as string) || status;
  }
  return status;
};

export type Action<T> = (
  val: T,
  pathNode: PathNode,
  queries: Record<string, Query>
) => boolean;

const ERR_CONFLICT = (path: string, at: string) =>
  `Updating the path '${path}' would create a conflict at '${at}'`;

const ERR_IMMUTABLE_FIELD = (path: string, idKey: string) =>
  `Performing an update on the path '${path}' would modify the immutable field '${idKey}'.`;

/**
 * Walks the expression and apply the given action for each key-value pair.
 *
 * @param expr The expression for the update operator.
 * @param arrayFilters Filter conditions passed to the operator.
 * @param options The options provided by the caller.
 * @param callback The action to apply for a given path and value.
 * @returns {Any[]<string>}
 */
export function walkExpression<T>(
  expr: AnyObject,
  arrayFilters: AnyObject[],
  options: ComputeOptions,
  callback: Action<T>
): string[] {
  const opts = options as ComputeOptions;
  const params =
    opts.local.updateParams ?? buildParams([expr], arrayFilters, opts);

  const modified: string[] = [];
  for (const key of Object.keys(expr)) {
    const { node, queries } = params[key];
    if (callback(expr[key] as T, node, queries)) modified.push(node.selector);
  }

  return modified.sort();
}

/** Returns the identifiers an array filter applies to, including within $and, $or and $nor. */
const filterIdentifiers = (filter: AnyObject): string[] =>
  Object.keys(filter).flatMap(k =>
    !k.startsWith("$")
      ? [k.split(".")[0]]
      : isArray(filter[k])
        ? (filter[k] as AnyObject[]).flatMap(filterIdentifiers)
        : []
  );

/**
 * Builds a map of parameters for update operations, where each parameter is associated
 * with its corresponding path node and query conditions. Conflicting selectors are detected.
 */
export function buildParams(
  exprList: AnyObject[],
  arrayFilters: AnyObject[],
  options: ComputeOptions
): Record<string, { node: PathNode; queries: Record<string, Query> }> {
  // map of (selector -> { node, queries})
  const params: ReturnType<typeof buildParams> = {};

  arrayFilters ||= [];

  // group filters by root field. handles multiple keys per filter object.
  const filterIndexMap: Record<string, AnyObject> = {};
  for (const filter of arrayFilters) {
    const ids = Array.from(new Set(filterIdentifiers(filter)));
    assert(
      ids.length,
      "Cannot use an expression without a top-level field name in arrayFilters"
    );
    assert(
      ids.length < 2,
      `Error parsing array filter :: caused by :: Expected a single top-level field name, found '${ids[0]}' and '${ids[1]}'`
    );
    assert(
      !filterIndexMap[ids[0]],
      `Found multiple array filters with the same top-level field name ${ids[0]}`
    );
    filterIndexMap[ids[0]] = filter;
  }

  const matchFirst = createMatchFirst(options.local.condition ?? {}, options);
  // selectors seen, and whether the children of each parent are $[]/$[identifier].
  const leaves = new Set<string>();
  const parents = new Map<string, boolean>();

  for (const expr of exprList) {
    for (const selector of Object.keys(expr)) {
      assertNoProto(selector);
      assert(
        !selector.startsWith("$"),
        `Dollar ($) prefixed field paths is not allowed in update operations: '${selector}'.`
      );

      const identifiers: string[] = [];
      let usesFirstOnly = false;
      const node: PathNode = selector.includes("$")
        ? { selector: "" }
        : { selector };

      if (!node.selector) {
        selector.split(".").reduce((n, v) => {
          const isFilter = v.startsWith("$[") && v.endsWith("]");
          if (v === FIRST_ONLY || isFilter) {
            assert(
              v !== FIRST_ONLY || !usesFirstOnly,
              `Too many positional (i.e. '$') elements found in path '${selector}'`
            );
            usesFirstOnly ||= v === FIRST_ONLY;
            let position = v;
            if (isFilter && v !== ARRAY_WIDE) {
              position = v.slice(2, -1);
              assert(
                /^[a-z]+\w*$/.test(position),
                `The filter <identifier> must begin with a lowercase letter and contain only alphanumeric characters. '${v}' is invalid.`
              );
              identifiers.push(position);
            }
            // an array directly nested in the matched item.
            if (n.position) n = n.next = { selector: "" };
            n.position = position;
            if (v === FIRST_ONLY) n.matchFirst = matchFirst;
          } else if (!n.position) {
            n.selector = n.selector ? `${n.selector}.${v}` : v;
          } else {
            n.next = { selector: v };
            return n.next;
          }

          return n;
        }, node);
      }

      const queries: Record<string, Query> = {};
      // create query for each filter
      for (const v of identifiers) {
        assert(
          filterIndexMap[v],
          `No array filter found for identifier '${v}' in path '${selector}'`
        );
        queries[v] = new Query(filterIndexMap[v], options);
      }

      // assert id field is not being modified (MongoDB immutability constraint)
      const idKey = options.idKey;
      assert(
        node.selector !== idKey && !node.selector.startsWith(`${idKey}.`),
        ERR_IMMUTABLE_FIELD(node.selector, idKey)
      );

      // assert there are no conflicting selectors, including a field that is
      // updated through both $[]/$[identifier] and a sub-path, index or $.
      const parts = selector.split(".");
      let path = parts[0];
      for (let i = 1; i < parts.length; i++) {
        const isArrayUpdate = parts[i].startsWith("$[");
        assert(
          !leaves.has(path) &&
            (parents.get(path) ?? isArrayUpdate) === isArrayUpdate,
          ERR_CONFLICT(selector, path)
        );
        parents.set(path, isArrayUpdate);
        path += "." + parts[i];
      }
      assert(
        !leaves.has(selector) && !parents.has(selector),
        ERR_CONFLICT(selector, selector)
      );
      leaves.add(selector);

      // save arguments for evaluation
      params[selector] = { node, queries };
    }
  }

  return params;
}

export type UpdateParams = ReturnType<typeof buildParams>;

/** Returns whether any selector uses a positional operator. */
export const hasPositional = (params: UpdateParams): boolean =>
  Object.values(params).some(p => p.node.position);

/**
 * Returns whether selectors may resolve to conflicting paths in some object.
 * A positional operator only resolves to an index, so selectors that do not conflict
 * when treating every positional operator and index as the same field never will.
 */
export function mayResolveToConflict(params: UpdateParams): boolean {
  const validator = new PathValidator();
  return Object.keys(params).some(
    selector =>
      !validator.add(
        selector
          .split(".")
          .map(v => (v.startsWith("$") || DIGITS.test(v) ? "*" : v))
          .join(".")
      )
  );
}

/** Returns the value at the path without traversing arrays other than by index. */
const getValue = (o: Any, selector: string): Any => {
  let cur = o;
  for (const k of selector.split(".")) {
    if (isArray(cur) ? !DIGITS.test(k) : !isObject(cur)) return undefined;
    cur = (cur as AnyObject)[k];
  }
  return cur;
};

/** Formats a value as in the messages of MongoDB. */
const format = (v: Any): string => {
  if (isArray(v)) return v.length ? `[ ${v.map(format).join(", ")} ]` : "[]";
  if (!isObject(v)) return JSON.stringify(v);
  const entries = Object.keys(v).map(k => `${k}: ${format(v[k])}`);
  return entries.length ? `{ ${entries.join(", ")} }` : "{}";
};

/** Resolves a path node against the object, keeping the items it selects and collecting its paths. */
const resolveNode = (
  root: AnyObject,
  o: AnyObject,
  n: PathNode,
  q: Record<string, Query>,
  prefix: string,
  paths?: string[]
): void => {
  const path = n.selector ? prefix + n.selector : prefix.slice(0, -1);
  if (!n.position) {
    paths?.push(path);
    return;
  }
  const arr = (n.selector ? getValue(o, n.selector) : o) as AnyObject[];
  if (n.position === FIRST_ONLY) {
    assert(isArray(arr), ERR_POSITIONAL_NO_MATCH);
  } else {
    assert(
      arr !== undefined,
      `The path '${path}' must exist in the document in order to apply array updates.`
    );
    if (!isArray(arr)) {
      const name = path.substring(path.lastIndexOf(".") + 1);
      assert(
        false,
        `Cannot apply array updates to non-array element ${name}: ${format(arr)}`
      );
    }
  }
  // $[] selects every item whatever the update changes, so there is nothing to keep.
  const isWide = n.position === ARRAY_WIDE;
  const descend = paths || n.next?.position;
  if (isWide && !descend) return;
  const indexes = matchIndexes(arr, n, q, root);
  if (!isWide) (n.resolved ??= new WeakMap()).set(arr, indexes);
  if (!descend) return;
  for (const i of indexes) {
    if (n.next) resolveNode(root, arr[i], n.next, q, `${path}.${i}.`, paths);
    else paths?.push(`${path}.${i}`);
  }
};

/**
 * Resolves positional selectors against the document before it is modified, so that an
 * update does not change what later selectors match, as on MongoDB. This also detects
 * conflicts that depend on the matched array items, which {@link buildParams} cannot.
 *
 * @param obj The document about to be modified.
 * @param params The parameters from {@link buildParams}.
 * @param checkConflicts Whether the resolved paths may conflict.
 */
export function resolvePositions(
  obj: AnyObject,
  params: UpdateParams,
  checkConflicts: boolean
): void {
  const paths: string[] | undefined = checkConflicts ? [] : undefined;
  for (const { node, queries } of Object.values(params)) {
    resolveNode(obj, obj, node, queries, "", paths);
  }
  if (!paths) return;

  const seen = new Set<string>();
  const conflicts: string[] = [];
  for (const path of paths) {
    if (seen.has(path)) conflicts.push(path);
    seen.add(path);
  }
  for (const path of seen) {
    for (let i = path.indexOf("."); i > -1; i = path.indexOf(".", i + 1)) {
      const parent = path.substring(0, i);
      if (seen.has(parent)) conflicts.push(parent);
    }
  }
  // report the first in document order.
  conflicts.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  assert(!conflicts.length, `Update created a conflict at '${conflicts[0]}'`);
}

/** Asserts that every array filter is used by a selector of the update, as on MongoDB. */
export function assertArrayFiltersUsed(
  arrayFilters: AnyObject[],
  params: UpdateParams,
  modifier: AnyObject
): void {
  const selectors = Object.keys(params).join(".");
  for (const id of arrayFilters.flatMap(filterIdentifiers)) {
    if (!selectors.includes(`$[${id}]`)) {
      assert(
        false,
        `The array filter for identifier '${id}' was not used in the update ${format(modifier)}`
      );
    }
  }
}
