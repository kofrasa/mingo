// Miscellaneous Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/rand/#mongodb-expression-exp.-rand

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";

/**
 * Returns a random float between 0 and 1.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
export const $rand = (obj: RawObject, expr: AnyVal, options: Options): number =>
  Math.random();
