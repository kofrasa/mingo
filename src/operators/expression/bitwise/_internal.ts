import { computeValue, ExpressionOperator, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { assert, isArray, isNil, isNumber } from "../../../util";

export const bitwise =
  (op: string, compute: (n: number[]) => number): ExpressionOperator =>
  (obj: RawObject, expr: AnyVal, options: Options) => {
    assert(isArray(expr), `${op}: expression must be an array.`);
    const nums = computeValue(obj, expr, null, options) as number[];
    if (nums.some(isNil)) return null;
    assert(
      nums.every(isNumber),
      `${op}: expression must evalue to array of numbers.`
    );
    return compute(nums);
  };
