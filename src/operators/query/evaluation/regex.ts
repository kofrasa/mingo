// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

import { $regex as __regex, createQueryOperator } from "../../_predicates";

/**
 * Selects documents where values match a specified regular expression.
 */
export const $regex = createQueryOperator(__regex);
