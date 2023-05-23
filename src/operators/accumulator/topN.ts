// https://www.mongodb.com/docs/manual/reference/operator/aggregation/topN/#mongodb-group-grp.-topN
import { Aggregator } from "../../aggregator";
import { ComputeOptions, computeValue, Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { $push } from "./push";

interface InputExpr {
  n: number;
  sortBy: Record<string, number>;
  output: AnyVal;
}

/**
 * Returns an aggregation of the top n elements within a group, according to the specified sort order.
 * If the group contains fewer than n elements, $topN returns all elements in the group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
export function $topN(
  collection: RawObject[],
  expr: InputExpr,
  options: Options
): AnyVal[] {
  const copts = ComputeOptions.init(options);
  const { n, sortBy } = computeValue(
    copts.local.groupId,
    expr,
    null,
    copts
  ) as Pick<InputExpr, "n" | "sortBy">;

  const result = new Aggregator(
    [{ $sort: sortBy }, { $limit: n }],
    copts.options
  ).run(collection);

  return $push(result, expr.output, copts);
}
