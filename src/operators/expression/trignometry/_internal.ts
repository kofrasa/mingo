// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { AnyVal, Callback, RawObject } from "../../../types";

const FIXED_POINTS = {
  undefined: null,
  null: null,
  NaN: NaN,
  Infinity: new Error(),
  "-Infinity": new Error()
} as Record<string, null | number | Error>;

/**
 * Returns an operator for a given trignometric function
 *
 * @param f The trignometric function
 */
export function createTrignometryOperator(
  f: Callback<number | null>,
  fixedPoints = FIXED_POINTS
): ExpressionOperator {
  const fp = Object.assign({}, FIXED_POINTS, fixedPoints);
  const keySet = new Set(Object.keys(fp));
  return (obj: RawObject, expr: AnyVal, options: Options): number | null => {
    const n = computeValue(obj, expr, null, options) as number;
    if (keySet.has(`${n}`)) {
      const res = fp[`${n}`];
      if (res instanceof Error) {
        throw new Error(
          `cannot apply $${f.name} to -inf, value must in (-inf,inf)`
        );
      }
      return res;
    }
    return f(n);
  };
}
