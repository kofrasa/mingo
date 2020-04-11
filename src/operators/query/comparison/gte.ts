// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import { createQueryOperator, $gte as __gte } from '../../_predicates'

/**
 * 	Matches values that are greater than or equal to a specified value.
 */
export const $gte = createQueryOperator(__gte)
