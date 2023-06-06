import { ArrayOrObject, RawObject } from "../../types";
import { applyUpdate, walkExpression } from "./_internal";

/** Increments a field by a specified value. */
export const $inc = (
  obj: RawObject,
  expr: Record<string, number>,
  arrayFilters: RawObject[] = []
) => {
  return walkExpression(expr, arrayFilters, (val, node, queries) => {
    return applyUpdate(obj, node, queries, (o: ArrayOrObject, k: number) => {
      o[k] = (o[k] as number) + (val as number);
      return true;
    });
  });
};
