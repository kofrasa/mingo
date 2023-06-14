/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

import { ExpressionOperator, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { $substr } from "./substr";

export const $substrCP: ExpressionOperator = (
  obj: RawObject,
  expr: AnyVal,
  options: Options
): AnyVal => {
  return $substr(obj, expr, options);
};
