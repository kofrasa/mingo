// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { createTrignometryOperator } from "./_internal";

/** Returns the inverse hyperbolic cosine (hyperbolic arc cosine) of a value in radians. */
export const $acosh = createTrignometryOperator(Math.acosh);
