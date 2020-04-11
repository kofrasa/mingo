// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

import { createQueryOperator, $mod as __mod } from '../../_predicates'

/**
 * Performs a modulo operation on the value of a field and selects documents with a specified result.
 */
export const $mod = createQueryOperator(__mod)