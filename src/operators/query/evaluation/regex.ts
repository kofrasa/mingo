// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

import { createQueryOperator, $regex as __regex } from '../../_predicates'

/**
 * Selects documents where values match a specified regular expression.
 */
export const $regex = createQueryOperator(__regex)