import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { isNumber } from "../../util";
import { stddev } from "./_internal";
import { $push } from "./push";

/**
 * Returns the population standard deviation of the input values.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @return {Number}
 */
export function $stdDevPop(
  collection: RawObject[],
  expr: AnyVal,
  options: Options
): number {
  return stddev($push(collection, expr, options).filter(isNumber), false);
}
