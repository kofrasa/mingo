// Bitwise Operators: https://www.mongodb.com/docs/manual/reference/operator/aggregation/bitAnd/#mongodb-expression-exp
import { bitwise } from "./_internal";

/**
 * Returns the result of a bitwise and operation on an array of int or long values.
 *
 * @param obj RawObject from collection
 * @param expr Right hand side expression of operator
 * @returns {Number}
 */
export const $bitAnd = bitwise("$bitAnd", nums =>
  nums.reduce((a, b) => a & b, -1)
);
