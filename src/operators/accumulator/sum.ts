import { Options } from "../../core";
import { AnyVal, Collection } from "../../types";
import { isArray, isNumber } from "../../util";
import { $push } from "./push";

/**
 * Returns the sum of all the values in a group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @returns {Number}
 */
export function $sum(
  collection: Collection,
  expr: AnyVal,
  options?: Options
): number {
  if (!isArray(collection)) return 0;

  // take a short cut if expr is number literal
  if (isNumber(expr)) return collection.length * expr;
  const nums = $push(collection, expr, options).filter(isNumber);
  return nums.reduce((acc, n) => acc + n, 0);
}
