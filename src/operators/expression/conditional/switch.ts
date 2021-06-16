/**
 * Conditional Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators
 */

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";

/**
 * An operator that evaluates a series of case expressions. When it finds an expression which
 * evaluates to true, it returns the resulting expression for that case. If none of the cases
 * evaluate to true, it returns the default expression.
 *
 * @param obj
 * @param expr
 */
export function $switch(
  obj: RawObject,
  expr: { branches: Array<{ case: AnyVal; then: AnyVal }>; default: AnyVal },
  options?: Options
): AnyVal {
  let thenExpr = null;
  // Array.prototype.find not supported in IE, hence the '.some()' proxy
  expr.branches.some((b: { case: AnyVal; then: AnyVal }) => {
    const found = computeValue(obj, b.case, null, options);
    if (found === true) thenExpr = b.then;
    return found;
  });

  return computeValue(
    obj,
    thenExpr !== null ? thenExpr : expr.default,
    null,
    options
  );
}
