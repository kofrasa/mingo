// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

import { $mod as __mod, createQueryOperator } from "../../_predicates";

/**
 * Performs a modulo operation on the value of a field and selects documents with a specified result.
 */
export const $mod = createQueryOperator(__mod);
