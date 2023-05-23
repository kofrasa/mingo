import { Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { covariance } from "./_internal";
import { $push } from "./push";

/**
 * Returns the population covariance of two numeric expressions.
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {Number|null}
 */
export function $covariancePop(
  collection: RawObject[],
  expr: AnyVal,
  options: Options
): number {
  return covariance($push(collection, expr, options) as number[][], false);
}
