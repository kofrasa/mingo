/**
 * Loads all Query and Projection operators
 */
import * as booleanOperators from '../operators/expression/boolean'
import * as comparsonOperators from '../operators/expression/comparison'
import { $project, $skip, $limit, $sort } from '../operators/pipeline'
import * as queryOperators from '../operators/query'
import * as projectionOperators from '../operators/projection'

// helpers
import { useOperators, OperatorType } from '../core'
import { into } from '../util'

/**
 * Enable default operators. This includes only query and projection operators
 */
function enableDefaultOperators() {
  useOperators(OperatorType.EXPRESSION, into({}, booleanOperators, comparsonOperators))
  useOperators(OperatorType.PIPELINE, { $project, $skip, $limit, $sort })
  useOperators(OperatorType.PROJECTION, projectionOperators)
  useOperators(OperatorType.QUERY, queryOperators)
}

enableDefaultOperators()