// Query Array Operators: https://docs.mongodb.com/manual/reference/operator/query-array/

import { createQueryOperator, $elemMatch as __elemMatch } from '../../_predicates'


export const $elemMatch = createQueryOperator(__elemMatch)