import { Any, AnyObject } from "../../types";
import { assert, isArray } from "../../util";
import { DEFAULT_OPTIONS } from "./_internal";
import { $pull } from "./pull";

/** Removes all instances of the specified values from an existing array. */
export function $pullAll(
  expr: Record<string, Any[]>,
  arrayFilters: AnyObject[] = [],
  options = DEFAULT_OPTIONS
) {
  const pullExpr: Record<string, AnyObject> = {};
  for (const k of Object.keys(expr)) {
    assert(isArray(expr[k]), `$pullAll requires an array argument.`);
    pullExpr[k] = { $in: expr[k] };
  }
  return $pull(pullExpr, arrayFilters, options);
}
