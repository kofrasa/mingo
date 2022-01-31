// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { computeValue, ExpressionOperator, Options } from "../../../core";
import { AnyVal, Callback, RawObject } from "../../../types";
import { isNil } from "../../../util";

/**
 * Returns an operator for a given trignometric function
 *
 * @param f The trignometric function
 */
export function createTrignometryOperator(
  f: Callback<number | null>,
  returnInfinity?: boolean
): ExpressionOperator {
  return (obj: RawObject, expr: AnyVal, options?: Options): number | null => {
    const n = computeValue(obj, expr, null, options) as number;
    if (isNaN(n) || isNil(n)) return n;
    if (n === Infinity || n === -Infinity) {
      if (returnInfinity) return n;
      throw new Error(
        `cannot apply $${f.name} to -inf, value must in (-inf,inf)`
      );
    }
    return f(n);
  };
}
