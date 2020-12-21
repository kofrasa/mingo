// Query Array Operators: https://docs.mongodb.com/manual/reference/operator/query-array/

import {
  $elemMatch as __elemMatch,
  createQueryOperator,
} from "../../_predicates";

/**
 * Selects documents if element in the array field matches all the specified $elemMatch conditions.
 */
export const $elemMatch = createQueryOperator(__elemMatch);
