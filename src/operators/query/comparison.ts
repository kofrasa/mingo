// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import {
  createQueryOperator,
  $eq as __eq,
  $gt as __gt,
  $gte as __gte,
  $in as __in,
  $lt as __lt,
  $lte as __lte,
  $ne as __ne,
  $nin as __nin,
} from '../_predicates'

export const $eq = createQueryOperator(__eq)
export const $gt = createQueryOperator(__gt)
export const $gte = createQueryOperator(__gte)
export const $in = createQueryOperator(__in)
export const $lt = createQueryOperator(__lt)
export const $lte = createQueryOperator(__lte)
export const $ne = createQueryOperator(__ne)
export const $nin = createQueryOperator(__nin)
