// Boolean Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#boolean-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawArray, RawObject } from "../../../types";
import { truthy } from "../../../util";

/**
 * Returns true only when all its expressions evaluate to true. Accepts any number of argument expressions.
 *
 * @param obj
 * @param expr
 * @returns {boolean}
 */
export function $and(obj: RawObject, expr: AnyVal, options: Options): AnyVal {
  const value = computeValue(obj, expr, null, options) as RawArray;
  return (
    truthy(value, options.useStrictMode) &&
    value.every(v => truthy(v, options.useStrictMode))
  );
}
