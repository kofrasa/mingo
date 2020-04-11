// Query Array Operators: https://docs.mongodb.com/manual/reference/operator/query-array/

import { createQueryOperator, $all as __all } from '../../_predicates'

/**
 * Matches arrays that contain all elements specified in the query.
 */
export const $all = createQueryOperator(__all)