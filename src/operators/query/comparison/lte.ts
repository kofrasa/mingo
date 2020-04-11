// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import { createQueryOperator, $lte as __lte } from '../../_predicates'

/**
 * Matches values that are less than or equal to the value specified in the query.
 */
export const $lte = createQueryOperator(__lte)
