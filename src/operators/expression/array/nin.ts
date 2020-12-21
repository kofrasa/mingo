// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

import { $nin as __nin, createExpressionOperator } from "../../_predicates";

/**
 * Returns a boolean indicating whether a specified value is not an array.
 * Note: This expression operator is missing from the documentation
 *
 * @param {Object} obj
 * @param {Array} expr
 */
export const $nin = createExpressionOperator(__nin);
