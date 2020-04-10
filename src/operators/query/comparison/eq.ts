// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import { createQueryOperator, $eq as __eq } from '../../_predicates'

export const $eq = createQueryOperator(__eq)
