import { computeValue, Options } from "../../core";
import { AnyVal, Collection } from "../../types";

/**
 * Returns the first value in a group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @returns {*}
 */
export function $first(
  collection: Collection,
  expr: AnyVal,
  options?: Options
): AnyVal {
  return collection.length > 0
    ? computeValue(collection[0], expr, null, options)
    : undefined;
}
