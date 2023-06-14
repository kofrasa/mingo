// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { isNil } from "../../../util";

/**
 * Returns the inverse tangent (arc tangent) of y / x in radians, where y and x are the first and second values passed to the expression respectively. */
export const $atan2: ExpressionOperator = (
  obj: RawObject,
  expr: AnyVal,
  options: Options
): number | null => {
  const [y, x] = computeValue(obj, expr, null, options) as number[];
  if (isNaN(y) || isNil(y)) return y;
  if (isNaN(x) || isNil(x)) return x;
  return Math.atan2(y, x);
};
