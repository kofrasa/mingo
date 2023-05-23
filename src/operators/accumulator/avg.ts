import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { isNumber } from "../../util";
import { $push } from "./push";

/**
 * Returns an average of all the values in a group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {Number}
 */
export function $avg(
  collection: RawObject[],
  expr: AnyVal,
  options: Options
): number {
  const data = $push(collection, expr, options).filter(isNumber);
  const sum = data.reduce<number>((acc: number, n: number) => acc + n, 0);
  return sum / (data.length || 1);
}
