// https://www.mongodb.com/docs/manual/reference/operator/aggregation/top/#mongodb-group-grp.-top
import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { $topN } from "./topN";

/**
 * Returns the top element within a group according to the specified sort order.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
export function $top(
  collection: RawObject[],
  expr: { sortBy: Record<string, number>; output: AnyVal },
  options: Options
): AnyVal[] {
  return $topN(collection, { ...expr, n: 1 }, options);
}
