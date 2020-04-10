// Query Array Operators: https://docs.mongodb.com/manual/reference/operator/query-array/

import { createQueryOperator, $size as __size } from '../../_predicates'

export const $size = createQueryOperator(__size)