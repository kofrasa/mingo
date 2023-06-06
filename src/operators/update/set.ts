import { AnyVal, ArrayOrObject, RawObject } from "../../types";
import { cloneDeep, isEqual } from "../../util";
import { applyUpdate, walkExpression } from "./_internal";

/** Replaces the value of a field with the specified value. */
export const $set = (
  obj: RawObject,
  expr: Record<string, AnyVal>,
  arrayFilters: RawObject[] = []
) => {
  return walkExpression(expr, arrayFilters, (val, node, queries) => {
    return applyUpdate(
      obj,
      node,
      queries,
      (o: ArrayOrObject, k: string) => {
        if (isEqual(o[k], val)) return false;
        o[k] = cloneDeep(val);
        return true;
      },
      { buildGraph: true }
    );
  });
};
