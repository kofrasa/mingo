// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { ExpressionOperator, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { computeDate, getDayOfYear } from "./_internal";

/**
 * Returns the day of the year for a date as a number between 1 and 366 (leap year).
 * @param obj
 * @param expr
 */
export const $dayOfYear: ExpressionOperator<number> = (
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number => {
  return getDayOfYear(computeDate(obj, expr, options));
};
