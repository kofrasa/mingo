// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

import { $eq as __eq, createExpressionOperator } from "../../_predicates";

/**
 * Matches values that are equal to a specified value.
 */
export const $eq = createExpressionOperator(__eq);
