// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import { createQueryOperator, $in as __in } from '../../_predicates'

export const $in = createQueryOperator(__in)
