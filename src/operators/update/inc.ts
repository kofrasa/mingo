import { AnyObject } from "../../types";
import { isNumber } from "../../util";
import { applyUpdate, DEFAULT_OPTIONS, walkExpression } from "./_internal";

/** Increments a field by a specified value. */
export function $inc(
  expr: Record<string, number>,
  arrayFilters: AnyObject[] = [],
  options = DEFAULT_OPTIONS
) {
  return (obj: AnyObject) => {
    return walkExpression<number>(
      expr,
      arrayFilters,
      options,
      (val, node, queries) => {
        return applyUpdate(
          obj,
          node,
          queries,
          (o: AnyObject, k: string) => {
            if (isNumber(o[k]) || o[k] === undefined) {
              const previous = o[k] as number | undefined;
              o[k] ||= 0;
              (o[k] as number) += val;
              return o[k] !== previous;
            }
            return false;
          },
          { buildGraph: true }
        );
      }
    );
  };
}
