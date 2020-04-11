// Query Array Operators: https://docs.mongodb.com/manual/reference/operator/query-array/

import { createQueryOperator, $elemMatch as __elemMatch } from '../../_predicates'

/**
 * Selects documents if element in the array field matches all the specified $elemMatch conditions.
 */
export const $elemMatch = createQueryOperator(__elemMatch)