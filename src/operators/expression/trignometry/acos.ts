// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { createTrignometryOperator } from "./_internal";

/** Returns the inverse cosine (arc cosine) of a value in radians. */
export const $acos = createTrignometryOperator(Math.acos);
