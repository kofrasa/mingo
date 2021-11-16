// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { createTrignometryOperator } from "./_internal";

/** Returns the inverse sin (arc sine) of a value in radians. */
export const $asin = createTrignometryOperator(Math.asin);
