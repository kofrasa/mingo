import { computeValue, ExpressionOperator, Options } from "../../core";
import { AnyVal, RawArray, RawObject } from "../../types";
import { $percentile as __percentile } from "../accumulator/percentile";

/**
 * Returns an array of scalar values that correspond to specified percentile values.
 *
 * @param obj The current object
 * @param expr The operator expression
 * @param options Options to use for processing
 * @returns {Array<number>}
 */
export const $percentile: ExpressionOperator<number[]> = (
  obj: RawObject,
  expr: { input: AnyVal; p: RawArray; method: "approximate" },
  options: Options
): number[] => {
  const input = computeValue(obj, expr.input, null, options) as RawArray;
  return __percentile(input, { ...expr, input: "$$CURRENT" }, options);
};
