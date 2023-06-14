// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

import { ExpressionOperator, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { computeDate } from "./_internal";

/**
 * Returns the year for a date as a number (e.g. 2014).
 * @param obj
 * @param expr
 */
export const $year: ExpressionOperator<number> = (
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number => {
  return computeDate(obj, expr, options).getUTCFullYear();
};
