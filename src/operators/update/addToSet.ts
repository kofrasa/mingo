import { Any, AnyObject } from "../../types";
import { assert, has, isArray, isObject, unique } from "../../util";
import {
  applyUpdate,
  clone,
  DEFAULT_OPTIONS,
  walkExpression
} from "./_internal";

/** Adds a value to an array unless the value is already present. */
export function $addToSet(
  expr: AnyObject,
  arrayFilters: AnyObject[] = [],
  options = DEFAULT_OPTIONS
) {
  for (const valueSpec of Object.values(expr)) {
    assert(
      !(isObject(valueSpec) && has(valueSpec, "$each")) ||
        isArray(valueSpec.$each),
      `The argument to $each in $addToSet must be an array.`
    );
  }

  return (obj: AnyObject) => {
    return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
      const args = { $each: [val] };
      if (isObject(val) && has(val, "$each")) {
        Object.assign(args, val);
      }
      return applyUpdate(
        obj,
        node,
        queries,
        (o: AnyObject, k: string) => {
          const prev = o[k] as Any[];
          if (isArray(prev)) {
            const set = unique(prev.concat(args.$each));
            if (set.length === prev.length) return false;
            o[k] = clone(set, options);
          } else if (prev === undefined) {
            o[k] = clone(args.$each, options);
          } else {
            return false;
          }
          return true;
        },
        { buildGraph: true }
      );
    });
  };
}
