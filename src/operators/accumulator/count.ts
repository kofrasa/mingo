import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";

/**
 * Returns the number of documents in the group or window.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @returns {*}
 */
export function $count(
  collection: RawObject[],
  expr: AnyVal,
  options: Options
): AnyVal {
  return collection.length;
}
