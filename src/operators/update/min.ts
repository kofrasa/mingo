import { UpdateOptions } from "../../core";
import { ArrayOrObject, RawObject } from "../../types";
import { compare } from "../../util";
import { Action, applyUpdate, walkExpression } from "./_internal";

/** Updates the value of the field to a specified value if the specified value is less than the current value of the field. */
export const $min = (
  obj: RawObject,
  expr: RawObject,
  arrayFilters: RawObject[] = [],
  options: UpdateOptions = {}
) => {
  return walkExpression(expr, arrayFilters, options, ((val, node, queries) => {
    return applyUpdate(
      obj,
      node,
      queries,
      (o: ArrayOrObject, k: string | number) => {
        if (compare(o[k], val) < 1) return false;
        o[k] = val;
        return true;
      }
    );
  }) as Action<number | string>);
};
