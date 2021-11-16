// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { createTrignometryOperator } from "./_internal";

const RADIANS_FACTOR = Math.PI / 180;

/** Converts a value from degrees to radians. */
export const $degreesToRadians = createTrignometryOperator(
  (n: number) => n * RADIANS_FACTOR,
  true /*returnInfinity*/
);
