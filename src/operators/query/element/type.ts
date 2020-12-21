// Query Element Operators: https://docs.mongodb.com/manual/reference/operator/query-element/

import { $type as __type, createQueryOperator } from "../../_predicates";

/**
 * Selects documents if a field is of the specified type.
 */
export const $type = createQueryOperator(__type);
