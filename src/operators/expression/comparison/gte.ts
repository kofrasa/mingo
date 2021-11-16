// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

import { $gte as __gte, createExpressionOperator } from "../../_predicates";

/**
 * 	Matches values that are greater than or equal to a specified value.
 */
export const $gte = createExpressionOperator(__gte);
