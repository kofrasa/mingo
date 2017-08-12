import { arithmeticOperators } from './arithmetic.js'
import { arrayOperators } from './array.js'
import { booleanOperators } from './boolean.js'
import { comparisonOperators } from './comparison.js'
import { conditionalOperators } from './conditional.js'
import { dateOperators } from './date.js'
import { literalOperators } from './literal.js'
import { setOperators } from './set.js'
import { stringOperators } from './string.js'
import { variableOperators } from './variable.js'

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
