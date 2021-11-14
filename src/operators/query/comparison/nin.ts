// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import { $nin as __nin, createQueryOperator } from "../../_predicates";

/**
 * Matches values that do not exist in an array specified to the query.
 */
export const $nin = createQueryOperator(__nin);
