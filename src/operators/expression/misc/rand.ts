// Misc Logical Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/rand/#mongodb-expression-exp.-rand

import { Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";

/**
 * Returns a random float between 0 and 1.
 *
 * @param selector
 * @param value
 * @returns {Function}
 */
export const $rand = (
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): number => Math.random();
