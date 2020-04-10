// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

import { createQueryOperator, $mod as __mod } from '../../_predicates'

export const $mod = createQueryOperator(__mod)