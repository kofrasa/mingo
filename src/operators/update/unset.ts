import { UpdateOptions } from "../../core";
import { ArrayOrObject, RawObject } from "../../types";
import { has, isArray } from "../../util";
import { applyUpdate, walkExpression } from "./_internal";

/** Deletes a particular field */
export const $unset = (
  obj: RawObject,
  expr: Record<string, "">,
  arrayFilters: RawObject[] = [],
  options: UpdateOptions = {}
): string[] => {
  return walkExpression(expr, arrayFilters, options, (_, node, queries) => {
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
