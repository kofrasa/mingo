// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

import { createTrignometryOperator } from "./_internal";

/** Returns the sine of a value that is measured in radians. */
export const $sin = createTrignometryOperator(Math.sin);
