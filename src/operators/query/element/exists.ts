// Query Element Operators: https://docs.mongodb.com/manual/reference/operator/query-element/

import { createQueryOperator, $exists as __exists} from '../../_predicates'

/**
 * Matches documents that have the specified field.
 */
export const $exists = createQueryOperator(__exists)
