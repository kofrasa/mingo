// Query Array Operators: https://docs.mongodb.com/manual/reference/operator/query-array/

import { $size as __size, createQueryOperator } from "../../_predicates";

/**
 * Selects documents if the array field is a specified size.
 */
export const $size = createQueryOperator(__size);
