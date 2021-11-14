// Query Bitwise Operators: https://docs.mongodb.com/manual/reference/operator/query-bitwise/

import { createBitwiseQueryOperator } from "../../_predicates";

/**
 * Matches numeric or binary values in which any bit from a set of bit positions has a value of 1.
 */
export const $bitsAnySet = createBitwiseQueryOperator(
  (result, _) => result > 0
);
