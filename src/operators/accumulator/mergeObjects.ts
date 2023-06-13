import { AccumulatorOperator, Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { $mergeObjects as __mergeObjects } from "../expression/object/mergeObjects";

/**
 * Combines multiple documents into a single document.
 *
 * @param {Array} collection The input array
 * @param {Object} _ The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {Array|*}
 */
export const $mergeObjects: AccumulatorOperator = (
  collection: RawObject[],
  _: AnyVal,
  options: Options
): RawObject => __mergeObjects({ docs: collection }, "$docs", options);
