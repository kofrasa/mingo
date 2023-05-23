// Miscellaneous Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#miscellaneous-operators

import { computeValue, Options } from "../../../core";
import { RawObject } from "../../../types";

/**
 * Randomly select documents at a given rate.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
export const $sampleRate = (
  obj: RawObject,
  expr: number,
  options: Options
): boolean =>
  Math.random() <= (computeValue(obj, expr, null, options) as number);
