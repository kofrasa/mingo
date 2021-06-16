// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { computeValue, Options } from "../../core";
import { AnyVal, RawObject } from "../../types";
import { Callback, isNil } from "../../util";

/**
 * Returns an operator for a given trignometric function
 *
 * @param f The trignometric function
 */
function createTrignometryOperator(
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

/** Returns the sine of a value that is measured in radians. */
export const $sin = createTrignometryOperator(Math.sin);

/** Returns the cosine of a value that is measured in radians. */
export const $cos = createTrignometryOperator(Math.cos);

/** Returns the tangent of a value that is measured in radians. */
export const $tan = createTrignometryOperator(Math.tan);

/** Returns the inverse sin (arc sine) of a value in radians. */
export const $asin = createTrignometryOperator(Math.asin);

/** Returns the inverse cosine (arc cosine) of a value in radians. */
export const $acos = createTrignometryOperator(Math.acos);

/** Returns the inverse tangent (arc tangent) of a value in radians. */
export const $atan = createTrignometryOperator(Math.atan);

/**
 * Returns the inverse tangent (arc tangent) of y / x in radians, where y and x are the first and second values passed to the expression respectively. */
export function $atan2(
  obj: RawObject,
  expr: AnyVal,
  options?: Options
): number | null {
  const [y, x] = computeValue(obj, expr, null, options) as number[];
  if (isNaN(y) || isNil(y)) return y;
  if (isNaN(x) || isNil(x)) return x;
  return Math.atan2(y, x);
}

/** Returns the inverse hyperbolic sine (hyperbolic arc sine) of a value in radians. */
export const $asinh = createTrignometryOperator(Math.asinh);

/** Returns the inverse hyperbolic cosine (hyperbolic arc cosine) of a value in radians. */
export const $acosh = createTrignometryOperator(Math.acosh);

/** Returns the inverse hyperbolic tangent (hyperbolic arc tangent) of a value in radians. */
export const $atanh = createTrignometryOperator(Math.atanh);

const RADIANS_FACTOR = Math.PI / 180;
/** Converts a value from degrees to radians. */
export const $degreesToRadians = createTrignometryOperator(
  (n: number) => n * RADIANS_FACTOR,
  true /*returnInfinity*/
);

const DEGREES_FACTOR = 180 / Math.PI;
/** Converts a value from radians to degrees. */
export const $radiansToDegrees = createTrignometryOperator(
  (n: number) => n * DEGREES_FACTOR,
  true /*returnInfinity*/
);
