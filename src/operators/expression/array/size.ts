// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { isArray } from "../../../util";

/**
 * Counts and returns the total the number of items in an array.
 *
 * @param obj
 * @param expr
 */
export function $size(obj: RawObject, expr: AnyVal, options: Options): AnyVal {
  const value = computeValue(obj, expr, null, options) as RawArray;
  return isArray(value) ? value.length : undefined;
}
