// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { createTrignometryOperator } from "./_internal";

/** Returns the inverse tangent (arc tangent) of a value in radians. */
export const $atan = createTrignometryOperator(Math.atan);
