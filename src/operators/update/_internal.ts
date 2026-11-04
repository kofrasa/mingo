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
  selector: string;
  position?: string;
  next?: PathNode;
};

// positional array specifier for first matching item.
const FIRST_ONLY = "$";
// positional array-wide specifier for all items in matching array.
const ARRAY_WIDE = "$[]";

/** Returns the indexes of the items of the array selected by the positional operator of the node. */
const selectIndexes = (
  arr: Any[],
  { selector, position: c }: PathNode,
  q: Record<string, Query>
): number[] => {
  if (c === FIRST_ONLY) {
    const i = arr.findIndex(e => q[selector].test({ [selector]: [e] }));
    // only matching documents should make it here, so this should never happen.
    assert(i > -1, "BUG: positional operator found no match for " + selector);
    return [i];
  }
  const indexes: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    // filter if applicable.
    if (c === ARRAY_WIDE || !q[c!] || q[c!].test({ [c!]: [arr[i]] })) {
      indexes.push(i);
    }
  }
  return indexes;
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
  const arr = resolve(o, selector) as AnyObject;
  // no update applied if we do not get correct type.
  if (!isArray(arr) || !arr.length) return false;

  // apply update to matching items.
  let status = false;
  for (const i of selectIndexes(arr, n, q)) {
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

const ERR_MISSING_FIELD =
  "You must include the array field for '.$' as part of the query document.";

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
  const filterIndexMap = arrayFilters.reduce(
    (res: Record<string, AnyObject>, filter) => {
      for (const k of Object.keys(filter)) {
        const parent = k.substring(0, k.indexOf(".")) || k;
        if (res[parent]) {
          res[parent][k] = filter[k];
        } else {
          res[parent] = { [k]: filter[k] };
        }
      }
      return res;
    },
    {}
  ) as Record<string, AnyObject>;

  let { condition } = options.local;
  condition = condition ?? {};
  const queryKeys = Object.keys(condition);
  const conflictDetector = new PathValidator();
  const arrayUpdates = new Map<string, boolean>();

  for (const expr of exprList) {
    for (const selector of Object.keys(expr)) {
      assertNoProto(selector);
      assert(
        !selector.startsWith("$"),
        `Dollar ($) prefixed field paths is not allowed in update operations: '${selector}'.`
      );

      const identifiers: string[] = [];
      const node: PathNode = selector.includes("$")
        ? { selector: "" }
        : { selector };

      if (!node.selector) {
        selector.split(".").reduce((n, v) => {
          if (v === FIRST_ONLY || v === ARRAY_WIDE) {
            n.position = v;
          } else if (v.startsWith("$[") && v.endsWith("]")) {
            const id = v.slice(2, -1);
            assert(
              /^[a-z]+\w*$/.test(id),
              `The filter <identifier> must begin with a lowercase letter and contain only alphanumeric characters. '${v}' is invalid.`
            );
            identifiers.push(id);
            n.position = id;
          } else if (!n.selector) {
            n.selector = v;
          } else if (!n.position) {
            n.selector += "." + v;
          } else {
            n.next = { selector: v };
            return n.next;
          }

          return n;
        }, node);
      }

      const queries: Record<string, Query> = {};
      if (identifiers.length) {
        // extract filters for each identifier
        const filters: Record<string, AnyObject> = {};
        for (const v of identifiers) filters[v] = filterIndexMap[v];
        // create query for each filter
        for (const k of Object.keys(filters)) {
          queries[k] = new Query(filters[k], options);
        }
      }

      if (node.position === FIRST_ONLY) {
        const field = node.selector;
        assert(queryKeys && queryKeys.length, ERR_MISSING_FIELD);
        const matches = queryKeys.filter(
          k => k === field || k.startsWith(field + ".")
        );
        assert(matches.length === 1, ERR_MISSING_FIELD);
        const k = matches[0];
        // add query for matching condition.
        queries[field] = new Query({ [k]: condition[k] }, options);
      }

      // assert id field is not being modified (MongoDB immutability constraint)
      const idKey = options.idKey;
      assert(
        node.selector !== idKey && !node.selector.startsWith(`${idKey}.`),
        ERR_IMMUTABLE_FIELD(node.selector, idKey)
      );

      // assert there are no conflicting selectors
      assert(
        conflictDetector.add(selector),
        `updating the path '${selector}' would create a conflict at '${selector}'`
      );

      // assert a field is not updated through both $[]/$[identifier] and a sub-path, index or $.
      const parts = selector.split(".");
      for (let i = 1; i < parts.length; i++) {
        const parent = parts.slice(0, i).join(".");
        const isArrayUpdate = parts[i].startsWith("$[");
        assert(
          (arrayUpdates.get(parent) ?? isArrayUpdate) === isArrayUpdate,
          `updating the path '${selector}' would create a conflict at '${parent}'`
        );
        arrayUpdates.set(parent, isArrayUpdate);
      }

      // save arguments for evaluation
      params[selector] = { node, queries };
    }
  }

  return params;
}

export type UpdateParams = ReturnType<typeof buildParams>;

const ERR_RESOLVED_CONFLICT = (path: string) =>
  `Update created a conflict at '${path}'`;

/** Collects the paths in the object that a path node resolves to. */
const collectPaths = (
  o: AnyObject,
  n: PathNode,
  q: Record<string, Query>,
  prefix: string,
  paths: string[]
): void => {
  const path = prefix + n.selector;
  if (!n.position) {
    paths.push(path);
    return;
  }
  const arr = resolve(o, n.selector) as AnyObject[];
  if (!isArray(arr) || !arr.length) return;
  for (const i of selectIndexes(arr, n, q)) {
    if (n.next) collectPaths(arr[i], n.next, q, `${path}.${i}.`, paths);
    else paths.push(`${path}.${i}`);
  }
};

/**
 * Asserts that no two selectors update the same field of the object, or a field and its parent.
 * This depends on the array items matched in the object, so it cannot be detected by {@link buildParams}.
 */
export function assertNoResolvedConflict(
  obj: AnyObject,
  params: UpdateParams
): void {
  const paths: string[] = [];
  for (const { node, queries } of Object.values(params)) {
    collectPaths(obj, node, queries, "", paths);
  }
  const seen = new Set<string>();
  for (const path of paths) {
    assert(!seen.has(path), ERR_RESOLVED_CONFLICT(path));
    seen.add(path);
  }
  for (const path of paths) {
    let i = path.indexOf(".");
    while (i > -1) {
      const parent = path.substring(0, i);
      assert(!seen.has(parent), ERR_RESOLVED_CONFLICT(parent));
      i = path.indexOf(".", i + 1);
    }
  }
}
