// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import { $eq as __eq, createQueryOperator } from "../../_predicates";

/**
 * Matches values that are equal to a specified value.
 */
export const $eq = createQueryOperator(__eq);
