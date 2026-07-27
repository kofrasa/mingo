import type { ComputeOptions } from "../../core/_internal";
import { evalExpr } from "../../core/_internal";
import type { Any, AnyObject, Options } from "../../types";
import { isInteger } from "../../util";
import { errExpectInteger } from "../expression/_internal";
import { $push } from "./push";

interface InputExpr {
  n: Any;
  input: Any;
}

/**
 * Returns an aggregation of the first n elements within a group. The elements returned are meaningful only if in a specified sort order.
 * If the group contains fewer than n elements, $firstN returns all elements in the group.
 */
export const $firstN = (
  coll: AnyObject[],
  expr: InputExpr,
  options: Options
) => {
  const foe = options.failOnError;
  const copts = options as ComputeOptions;
  const m = coll.length;
  const n = evalExpr(copts?.local?.groupId, expr.n, copts) as number;
  if (!isInteger(n) || n < 1)
    return errExpectInteger(foe, "$firstN 'n'", { min: 1 });

  return $push(m <= n ? coll : coll.slice(0, n), expr.input, options);
};
