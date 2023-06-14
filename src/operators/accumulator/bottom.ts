// https://www.mongodb.com/docs/manual/reference/operator/aggregation/bottom/#mongodb-group-grp.-bottom
import { AccumulatorOperator, Options } from "../../core";
import { AnyVal, RawArray, RawObject } from "../../types";
import { $bottomN } from "./bottomN";

/**
 * Returns the bottom element within a group according to the specified sort order.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
export const $bottom: AccumulatorOperator = (
  collection: RawObject[],
  expr: { sortBy: Record<string, number>; output: AnyVal },
  options: Options
): RawArray => $bottomN(collection, { ...expr, n: 1 }, options);
