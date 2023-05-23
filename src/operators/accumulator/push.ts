import { ComputeOptions, computeValue, Options } from "../../core";
import { AnyVal, RawArray, RawObject } from "../../types";
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
  collection: RawObject[],
  expr: AnyVal,
  options: Options
): RawArray {
  if (isNil(expr)) return collection;
  const copts = ComputeOptions.init(options);
  return collection.map(obj =>
    computeValue(obj, expr, null, copts.update(obj))
  );
}
