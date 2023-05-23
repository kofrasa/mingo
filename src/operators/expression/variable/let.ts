/**
 * Variable Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#variable-expression-operators
 */

import { ComputeOptions, computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";

/**
 * Defines variables for use within the scope of a sub-expression and returns the result of the sub-expression.
 *
 * @param obj The target object for this expression
 * @param expr The right-hand side of the operator
 * @param options Options to use for this operattion
 * @returns {*}
 */
export function $let(
  obj: RawObject,
  expr: { vars: RawObject; in: AnyVal },
  options: Options
): AnyVal {
  // resolve vars
  const variables = {};
  for (const [key, val] of Object.entries(expr.vars)) {
    variables[key] = computeValue(obj, val, null, options);
  }

  return computeValue(
    obj,
    expr.in,
    null,
    ComputeOptions.init(options, obj, { variables })
  );
}
