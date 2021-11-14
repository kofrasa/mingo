// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import { $gt as __gt, createQueryOperator } from "../../_predicates";

/**
 * Matches values that are greater than a specified value.
 */
export const $gt = createQueryOperator(__gt);
