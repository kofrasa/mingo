// Bitwise Operators: https://www.mongodb.com/docs/manual/reference/operator/aggregation/bitNot/#mongodb-expression-exp
import { bitwise } from "./_internal";

/**
 * Returns the result of a bitwise xor (exclusive or) operation on an array of int and long values.
 *
 * @param obj RawObject from collection
 * @param expr Right hand side expression of operator
 * @returns {Number}
 */
export const $bitXor = bitwise("$bitXor", nums =>
  nums.reduce((a, b) => a ^ b, 0)
);
