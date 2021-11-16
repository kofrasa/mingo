// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

import { $lt as __lt, createExpressionOperator } from "../../_predicates";

/**
 * Matches values that are less than the value specified in the query.
 */
export const $lt = createExpressionOperator(__lt);
