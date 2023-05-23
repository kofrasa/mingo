import { computeValue, Options } from "../../core";
import { AnyVal, RawObject } from "../../types";

/**
 * Returns the last value in the collection.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
export function $last(
  collection: RawObject[],
  expr: AnyVal,
  options: Options
): AnyVal {
  return collection.length > 0
    ? computeValue(collection[collection.length - 1], expr, null, options)
    : undefined;
}
