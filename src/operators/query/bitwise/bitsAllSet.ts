// Query Bitwise Operators: https://docs.mongodb.com/manual/reference/operator/query-bitwise/

import { createBitwiseQueryOperator } from "../../_predicates";

/**
 * Matches numeric or binary values in which a set of bit positions all have a value of 1.
 */
export const $bitsAllSet = createBitwiseQueryOperator(
  (result, mask) => result == mask
);
