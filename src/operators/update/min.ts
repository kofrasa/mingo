import { AnyObject } from "../../types";
import { compare, has } from "../../util";
import { applyUpdate, DEFAULT_OPTIONS, walkExpression } from "./_internal";

/** Updates the value of the field to a specified value if the specified value is less than the current value of the field. */
export function $min(
  expr: AnyObject,
  arrayFilters: AnyObject[] = [],
  options = DEFAULT_OPTIONS
) {
  return (obj: AnyObject) => {
    return walkExpression(expr, arrayFilters, options, (val, node, queries) => {
      // If the field does not exist, the $min operator sets the field to the specified value.
      return applyUpdate(
        obj,
        node,
        queries,
        (o: AnyObject, k: string | number) => {
          if (has(o, String(k)) && compare(o[k], val) < 1) return false;
          o[k] = val;
          return true;
        },
        { buildGraph: true }
      );
    });
  };
}
