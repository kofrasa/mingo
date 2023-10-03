import { UpdateOptions } from "../../core";
import { ArrayOrObject, RawObject } from "../../types";
import { compare } from "../../util";
import { Action, applyUpdate, walkExpression } from "./_internal";

/** Updates the value of the field to a specified value if the specified value is greater than the current value of the field. */
export const $max = (
  obj: RawObject,
  expr: RawObject,
  arrayFilters: RawObject[] = [],
  options: UpdateOptions = {}
) => {
  return walkExpression(expr, arrayFilters, options, ((val, node, queries) => {
    // If the field does not exist, the $max operator sets the field to the specified value.
    return applyUpdate(
      obj,
      node,
      queries,
      (o: ArrayOrObject, k: string | number) => {
        o[k] = o[k] === undefined ? val : (o[k] as number | string);
        if (compare(o[k], val) > -1) return false;
        o[k] = val;
        return true;
      },
      { buildGraph: true }
    );
  }) as Action<number | string>);
};
