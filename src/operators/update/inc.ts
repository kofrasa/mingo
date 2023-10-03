import { UpdateOptions } from "../../core";
import { ArrayOrObject, RawObject } from "../../types";
import { assert, isNumber, resolve } from "../../util";
import { applyUpdate, walkExpression } from "./_internal";

/** Increments a field by a specified value. */
export const $inc = (
  obj: RawObject,
  expr: Record<string, number>,
  arrayFilters: RawObject[] = [],
  options: UpdateOptions = {}
) => {
  return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
    if (!node.child) {
      const n = resolve(obj, node.parent);
      assert(
        n === undefined || isNumber(n),
        `cannot apply $inc to a value of non-numeric type`
      );
    }
    return applyUpdate(
      obj,
      node,
      queries,
      (o: ArrayOrObject, k: number) => {
        o[k] = ((o[k] ||= 0) as number) + (val as number);
        return true;
      },
      { buildGraph: true }
    );
  });
};
