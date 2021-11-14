// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import { $in as __in, createQueryOperator } from "../../_predicates";

/**
 * Matches any of the values that exist in an array specified in the query.
 */
export const $in = createQueryOperator(__in);
