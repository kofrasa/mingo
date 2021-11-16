// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { computeValue, Options } from "../../../core";
import { AnyVal, RawObject } from "../../../types";
import { Callback, isNil } from "../../../util";

/**
 * Returns an operator for a given trignometric function
 *
 * @param f The trignometric function
 */
export function createTrignometryOperator(
  f: Callback<number | null>,
  returnInfinity?: boolean
): Callback<number | null> {
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
