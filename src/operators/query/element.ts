// Query Element Operators: https://docs.mongodb.com/manual/reference/operator/query-element/

import {
  createQueryOperator,
  $exists as __exists,
  $type as __type
} from '../predicates'

export const $exists = createQueryOperator(__exists)
export const $type = createQueryOperator(__type)
