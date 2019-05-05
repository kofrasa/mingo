import { arithmeticOperators } from './arithmetic'
import { arrayOperators } from './array'
import { booleanOperators } from './boolean'
import { comparisonOperators } from './comparison'
import { conditionalOperators } from './conditional'
import { dateOperators } from './date'
import { literalOperators } from './literal'
import { setOperators } from './set'
import { stringOperators } from './string'
import { variableOperators } from './variable'

// combine aggregate operators
export const expressionOperators = Object.assign(
  {},
  arithmeticOperators,
  arrayOperators,
  booleanOperators,
  comparisonOperators,
  conditionalOperators,
  dateOperators,
  literalOperators,
  setOperators,
  stringOperators,
  variableOperators
)
