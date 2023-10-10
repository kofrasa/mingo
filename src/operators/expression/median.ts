import { computeValue, ExpressionOperator, Options } from "../../core";
import { AnyVal, RawArray, RawObject } from "../../types";
import { $median as __median } from "../accumulator/median";

/**
 * Returns an approximation of the median, the 50th percentile, as a scalar value.
 *
 * @param obj The current object
 * @param expr The operator expression
 * @param options Options to use for processing
 * @returns {number}
 */
export const $median: ExpressionOperator = (
  obj: RawObject,
  expr: { input: AnyVal },
  options: Options
): AnyVal => {
  const input = computeValue(obj, expr.input, null, options) as RawArray;
  return __median(input, { input: "$$CURRENT" }, options);
};
