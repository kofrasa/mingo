import { AnyObject } from "../../types";
import { assert, isNumber, isObject } from "../../util";
import { applyUpdate, DEFAULT_OPTIONS, walkExpression } from "./_internal";

const BIT_OPS = ["and", "or", "xor"] as const;
type BitOp = (typeof BIT_OPS)[number];

/** Performs a bitwise update of a field. The operator supports AND, OR, and XOR.*/
export function $bit(
  expr: Record<string, Partial<Record<BitOp, number>>>,
  arrayFilters: AnyObject[] = [],
  options = DEFAULT_OPTIONS
) {
  for (const vals of Object.values(expr)) {
    assert(isObject(vals), `$bit operator expression must be an object.`);
    const op = Object.keys(vals) as BitOp[];
    assert(
      op.length === 1 && BIT_OPS.includes(op[0]),
      `$bit spec is invalid '${op[0]}'. Must be one of 'and', 'or', or 'xor'.`
    );
    assert(
      isNumber(vals[op[0]]),
      `$bit expression value must be a number. Got ${typeof vals[op[0]]}`
    );
  }
  return (obj: AnyObject) => {
    return walkExpression<Record<BitOp, number>>(
      expr,
      arrayFilters,
      options,
      (val, node, queries) => {
        const op = Object.keys(val) as BitOp[];
        return applyUpdate(
          obj,
          node,
          queries,
          (o: AnyObject, k: string) => {
            let n = o[k] as number;
            const v = val[op[0]];
            const missing = n === undefined;
            if (!missing && !(isNumber(n) && isNumber(v))) return false;
            n = n || 0;
            switch (op[0]) {
              case "and":
                return (o[k] = n & v) !== n || missing;
              case "or":
                return (o[k] = n | v) !== n || missing;
              case "xor":
                return (o[k] = n ^ v) !== n || missing;
            }
          },
          { buildGraph: true }
        );
      }
    );
  };
}
