// Boolean Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#boolean-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { ensureArray } from "../../../util";

/**
 * Returns the boolean value that is the opposite of its argument expression. Accepts a single argument expression.
 *
 * @param obj RawObject from collection
 * @param expr Right hand side expression of operator
 * @returns {boolean}
 */
export function $not(obj: RawObject, expr: AnyVal, options: Options): AnyVal {
  const booleanExpr = ensureArray(expr);
  // array values are truthy so an emty array is false
  if (booleanExpr.length == 0) return false;
  // use provided value non-array value
  if (booleanExpr.length == 1)
    return !computeValue(obj, booleanExpr[0], null, options);
  // expects a single argument
  throw "Expression $not takes exactly 1 argument";
}
