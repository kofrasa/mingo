// Query Bitwise Operators: https://docs.mongodb.com/manual/reference/operator/query-bitwise/

import { createBitwiseOperator } from "./_internal";

/**
 * Matches numeric or binary values in which a set of bit positions all have a value of 1.
 */
export const $bitsAllSet = createBitwiseOperator(
  (result, mask) => result == mask
);
