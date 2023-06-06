import { ArrayOrObject, RawObject } from "../../types";
import { has, isArray } from "../../util";
import { applyUpdate, walkExpression } from "./_internal";

/** Deletes a particular field */
export const $unset = (
  obj: RawObject,
  expr: Record<string, "">,
  arrayFilters: RawObject[] = []
): string[] => {
  return walkExpression(expr, arrayFilters, (_, node, queries) => {
    return applyUpdate(obj, node, queries, (o: ArrayOrObject, k: string) => {
      if (!has(o as RawObject, k)) return false;
      if (isArray(o)) {
        o[k] = null;
      } else {
        delete o[k];
      }
      return true;
    });
  });
};
