import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { isNumber } from "../../util";
import { stddev } from "./_internal";
import { $push } from "./push";

/**
 * Returns the sample standard deviation of the input values.
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {Number|null}
 */
export function $stdDevSamp(
  collection: RawObject[],
  expr: AnyVal,
  options: Options
): number {
  return stddev($push(collection, expr, options).filter(isNumber), true);
}
