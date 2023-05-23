// https://www.mongodb.com/docs/manual/reference/operator/aggregation/bottom/#mongodb-group-grp.-bottom
import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { $bottomN } from "./bottomN";

/**
 * Returns the bottom element within a group according to the specified sort order.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
export function $bottom(
  collection: RawObject[],
  expr: { sortBy: Record<string, number>; output: AnyVal },
  options: Options
): AnyVal[] {
  return $bottomN(collection, { ...expr, n: 1 }, options);
}
