// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { createTrignometryOperator } from "./_internal";

/** Returns the inverse hyperbolic sine (hyperbolic arc sine) of a value in radians. */
export const $asinh = createTrignometryOperator(Math.asinh, {
  Infinity: Infinity,
  "-Infinity": -Infinity,
});
