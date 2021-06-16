import { computeValue, Options } from "../../core";
import { AnyVal, Collection, RawArray } from "../../types";
import { isNil } from "../../util";

/**
 * Returns an array of all values for the selected field among for each document in that group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {Array|*}
 */
export function $push(
  collection: Collection,
  expr: AnyVal,
  options?: Options
): RawArray {
  if (isNil(expr)) return collection;
  return collection.map((obj) => computeValue(obj, expr, null, options));
}
