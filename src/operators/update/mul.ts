import { UpdateOptions } from "../../core";
import { ArrayOrObject, RawObject } from "../../types";
import { Action, applyUpdate, walkExpression } from "./_internal";

/** Multiply the value of a field by a number. */
export const $mul = (
  obj: RawObject,
  expr: Record<string, number>,
  arrayFilters: RawObject[] = [],
  options: UpdateOptions = {}
) => {
  return walkExpression(expr, arrayFilters, options, ((val, node, queries) => {
    return applyUpdate(
      obj,
      node,
      queries,
      (o: ArrayOrObject, k: string | number) => {
        const prev = o[k] as number;
        o[k] = o[k] === undefined ? 0 : o[k] * val;
        return o[k] !== prev;
      },
      { buildGraph: true }
    );
  }) as Action<number>);
};
