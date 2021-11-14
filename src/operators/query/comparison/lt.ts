// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import { $lt as __lt, createQueryOperator } from "../../_predicates";

/**
 * Matches values that are less than the value specified in the query.
 */
export const $lt = createQueryOperator(__lt);
