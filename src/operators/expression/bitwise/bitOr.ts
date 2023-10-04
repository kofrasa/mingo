// Bitwise Operators: https://www.mongodb.com/docs/manual/reference/operator/aggregation/bitOr/#mongodb-expression-exp
import { bitwise } from "./_internal";

/**
 * Returns the result of a bitwise or operation on an array of int or long values.
 *
 * @param obj RawObject from collection
 * @param expr Right hand side expression of operator
 * @returns {Number}
 */
export const $bitOr = bitwise("$bitOr", nums =>
  nums.reduce((a, b) => a | b, 0)
);
