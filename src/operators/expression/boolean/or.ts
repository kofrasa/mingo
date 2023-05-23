// Boolean Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#boolean-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { truthy } from "../../../util";

/**
 * Returns true when any of its expressions evaluates to true. Accepts any number of argument expressions.
 *
 * @param obj
 * @param expr
 * @returns {boolean}
 */
export function $or(obj: RawObject, expr: AnyVal, options: Options): AnyVal {
  const value = computeValue(obj, expr, null, options) as RawArray;
  const strict = options.useStrictMode;
  return truthy(value, strict) && value.some(v => truthy(v, strict));
}
