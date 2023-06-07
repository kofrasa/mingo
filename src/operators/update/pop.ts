import { UpdateOptions } from "../../core";
import { ArrayOrObject, RawArray, RawObject } from "../../types";
import { Action, applyUpdate, walkExpression } from "./_internal";

/** Removes the first or last element of an array. */
export const $pop = (
  obj: RawObject,
  expr: Record<string, 1 | -1>,
  arrayFilters: RawObject[] = [],
  options: UpdateOptions = {}
) => {
  return walkExpression(expr, arrayFilters, options, ((val, node, queries) => {
    return applyUpdate(obj, node, queries, (o: ArrayOrObject, k: string) => {
      const arr = o[k] as RawArray;
      if (!arr.length) return false;
      if (val === -1) {
        arr.splice(0, 1);
      } else {
        arr.pop();
      }
      return true;
    });
  }) as Action<number>);
};
