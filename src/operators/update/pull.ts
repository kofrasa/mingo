import { UpdateOptions } from "../../core";
import { Query } from "../../query";
import { AnyVal, ArrayOrObject, RawArray, RawObject } from "../../types";
import { Action, applyUpdate, walkExpression } from "./_internal";

/** Removes from an existing array all instances of a value or values that match a specified condition. */
export const $pull = (
  obj: RawObject,
  expr: RawObject,
  arrayFilters: RawObject[] = [],
  options: UpdateOptions = {}
) => {
  return walkExpression(expr, arrayFilters, options, ((val, node, queries) => {
    const query = new Query({ k: val }, options.queryOptions);
    const pred = (v: AnyVal) => query.test({ k: v });
    return applyUpdate(obj, node, queries, (o: ArrayOrObject, k: string) => {
      const prev = o[k] as RawArray;
      const curr = new Array<AnyVal>();
      const found = prev
        .map(v => {
          const b = pred(v);
          if (!b) curr.push(v);
          return b;
        })
        .some(Boolean);
      if (!found) return false;
      o[k] = curr;
      return true;
    });
  }) as Action);
};
