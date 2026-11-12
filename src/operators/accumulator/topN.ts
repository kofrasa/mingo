import { ComputeOptions } from "../../core/_internal";
import { Lazy } from "../../lazy";
import { Any, AnyObject, Options, SortSpec } from "../../types";
import { $sort } from "../pipeline/sort";
import { evalGroupArg } from "./_internal";
import { $push } from "./push";

interface InputExpr {
  n: number;
  sortBy: SortSpec;
  output: Any;
}

/**
 * Returns an aggregation of the top n elements within a group, according to the specified sort order.
 * If the group contains fewer than n elements, $topN returns all elements in the group.
 */
export const $topN = (coll: AnyObject[], expr: InputExpr, options: Options) => {
  const copts = options as ComputeOptions;
  const { n, sortBy } = evalGroupArg(expr, copts) as Pick<
    InputExpr,
    "n" | "sortBy"
  >;

  const result = $sort(Lazy(coll), sortBy, options).take(n).collect();
  return $push(result, expr.output, copts);
};
