// Query Bitwise Operators: https://docs.mongodb.com/manual/reference/operator/query-bitwise/

import { createBitwiseOperator } from "./_internal";

/**
 * Matches numeric or binary values in which a set of bit positions all have a value of 0.
 */
export const $bitsAllClear = createBitwiseOperator((result, _) => result == 0);
