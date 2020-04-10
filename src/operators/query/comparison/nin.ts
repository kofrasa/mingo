// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import { createQueryOperator, $nin as __nin } from '../../_predicates'

export const $nin = createQueryOperator(__nin)
