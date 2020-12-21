// Query Array Operators: https://docs.mongodb.com/manual/reference/operator/query-array/

import { $all as __all, createQueryOperator } from "../../_predicates";

/**
 * Matches arrays that contain all elements specified in the query.
 */
export const $all = createQueryOperator(__all);
