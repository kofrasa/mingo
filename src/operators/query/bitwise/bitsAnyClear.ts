// Query Bitwise Operators: https://docs.mongodb.com/manual/reference/operator/query-bitwise/

import { createBitwiseOperator } from "./_internal";

/**
 * Matches numeric or binary values in which any bit from a set of bit positions has a value of 0.
 */
export const $bitsAnyClear = createBitwiseOperator(
  (result, mask) => result < mask
);
