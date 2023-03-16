import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { DEFAULT_COMPARATOR } from "../../util";
import { $push } from "./push";

/**
 * Returns the lowest value in a group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} The options to use for this operator
 * @returns {*}
 */
export function $min(
  collection: RawObject[],
  expr: AnyVal,
  options?: Options
): AnyVal {
  const nums = $push(collection, expr, options) as number[];
  const n = nums.reduce(
    (acc, n) => (DEFAULT_COMPARATOR(n, acc) <= 0 ? n : acc),
    Infinity
  );
  return n === Infinity ? undefined : n;
}
