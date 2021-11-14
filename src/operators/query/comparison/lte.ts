// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import { $lte as __lte, createQueryOperator } from "../../_predicates";

/**
 * Matches values that are less than or equal to the value specified in the query.
 */
export const $lte = createQueryOperator(__lte);
