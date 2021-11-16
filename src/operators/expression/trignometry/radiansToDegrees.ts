// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { createTrignometryOperator } from "./_internal";

const DEGREES_FACTOR = 180 / Math.PI;

/** Converts a value from radians to degrees. */
export const $radiansToDegrees = createTrignometryOperator(
  (n: number) => n * DEGREES_FACTOR,
  true /*returnInfinity*/
);
