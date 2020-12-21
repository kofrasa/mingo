/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

import { $toDouble } from "./toDouble";

/**
 * Converts a value to a decimal. If the value cannot be converted to a decimal, $toDecimal errors.
 * If the value is null or missing, $toDecimal returns null.
 * This is just an alias for `$toDouble` in this library.
 */
export const $toDecimal = $toDouble;
