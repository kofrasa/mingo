// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import { createQueryOperator, $ne as __ne } from '../../_predicates'

/**
 * Matches all values that are not equal to the value specified in the query.
 */
export const $ne = createQueryOperator(__ne)
