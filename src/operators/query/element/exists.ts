// Query Element Operators: https://docs.mongodb.com/manual/reference/operator/query-element/

import { createQueryOperator, $exists as __exists} from '../../_predicates'

export const $exists = createQueryOperator(__exists)
