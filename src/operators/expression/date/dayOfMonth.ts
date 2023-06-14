// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { ExpressionOperator, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { computeDate } from "./_internal";

/**
 * Returns the day of the month for a date as a number between 1 and 31.
 * @param obj
 * @param expr
 */
export const $dayOfMonth: ExpressionOperator<number> = (
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number => {
  return computeDate(obj, expr, options).getUTCDate();
};
