// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

import { $gt as __gt, createExpressionOperator } from "../../_predicates";

/**
 * Matches values that are greater than a specified value.
 */
export const $gt = createExpressionOperator(__gt);
