import { ComputeOptions } from "../../core/_internal";
import { Lazy } from "../../lazy";
import { Any, Options, SortSpec } from "../../types";
import { $sort } from "../pipeline/sort";
import { evalGroupArg } from "./_internal";
import { $push } from "./push";

interface InputExpr {
  n: Any;
  sortBy: SortSpec;
  output: string;
}

/**
 * Returns an aggregation of the bottom n elements within a group, according to the specified sort order.
 * If the group contains fewer than n elements, $bottomN returns all elements in the group.
 */
export const $bottomN = (coll: Any[], expr: Any, options: Options) => {
  const copts = options as ComputeOptions;
  const args = expr as InputExpr;
  const n = evalGroupArg(args.n, copts) as number;
  const result = $sort(Lazy(coll), args.sortBy, options).collect();
  const m = result.length;
  return $push(m <= n ? result : result.slice(m - n), args.output, copts);
};
