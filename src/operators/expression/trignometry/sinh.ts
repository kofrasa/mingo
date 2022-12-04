// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { createTrignometryOperator } from "./_internal";

/** Returns the hyperbolic sine of a value that is measured in radians. */
export const $sinh = createTrignometryOperator(Math.sinh, {
  "-Infinity": -Infinity,
  Infinity: Infinity,
});
