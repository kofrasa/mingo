// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

import { $lte as __lte, createExpressionOperator } from "../../_predicates";

/**
 * Matches values that are less than or equal to the value specified in the query.
 */
export const $lte = createExpressionOperator(__lte);
