// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { ExpressionOperator, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { computeDate } from "./_internal";

/**
 * Returns the seconds for a date as a number between 0 and 60 (leap seconds).
 * @param obj
 * @param expr
 */
export const $second: ExpressionOperator<number> = (
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number => {
  return computeDate(obj, expr, options).getUTCSeconds();
};
