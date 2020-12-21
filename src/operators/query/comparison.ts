// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

import {
  $eq as __eq,
  $gt as __gt,
  $gte as __gte,
  $in as __in,
  $lt as __lt,
  $lte as __lte,
  $ne as __ne,
  $nin as __nin,
  createQueryOperator,
} from "../_predicates";

/**
 * Matches values that are equal to a specified value.
 */
export const $eq = createQueryOperator(__eq);

/**
 * Matches values that are greater than a specified value.
 */
export const $gt = createQueryOperator(__gt);

/**
 * 	Matches values that are greater than or equal to a specified value.
 */
export const $gte = createQueryOperator(__gte);

/**
 * Matches any of the values that exist in an array specified in the query.
 */
export const $in = createQueryOperator(__in);

/**
 * Matches values that are less than the value specified in the query.
 */
export const $lt = createQueryOperator(__lt);

/**
 * Matches values that are less than or equal to the value specified in the query.
 */
export const $lte = createQueryOperator(__lte);

/**
 * Matches all values that are not equal to the value specified in the query.
 */
export const $ne = createQueryOperator(__ne);

/**
 * Matches values that do not exist in an array specified to the query.
 */
export const $nin = createQueryOperator(__nin);
