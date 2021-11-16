// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { createTrignometryOperator } from "./_internal";

/** Returns the inverse hyperbolic tangent (hyperbolic arc tangent) of a value in radians. */
export const $atanh = createTrignometryOperator(Math.atanh);
