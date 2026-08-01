import { AnyObject } from "../../types";
import { assert, isNumber } from "../../util";
import { applyUpdate, DEFAULT_OPTIONS, walkExpression } from "./_internal";

/** Multiply the value of a field by a number. */
export function $mul(
  expr: Record<string, number>,
  arrayFilters: AnyObject[] = [],
  options = DEFAULT_OPTIONS
) {
  for (const factor of Object.values(expr)) {
    assert(isNumber(factor), `Cannot multiply with non-numeric argument.`);
  }

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
            const prev = o[k] as number;
            if (isNumber(o[k])) o[k] = o[k] * val;
            else if (o[k] === undefined) o[k] = 0;
            return o[k] !== prev;
          },
          { buildGraph: true }
        );
      }
    );
  };
}
