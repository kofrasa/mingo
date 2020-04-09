// default operators
import * as booleanOperators from '../operators/expression/boolean'
import * as comparsonOperators from '../operators/expression/comparison'
import { $project, $skip, $limit, $sort } from '../operators/pipeline'
import * as queryArray from '../operators/query/array'
import * as queryComparison from '../operators/query/comparison'
import * as queryElement from '../operators/query/element'
import * as queryEvaluation from '../operators/query/evaluation'
import * as queryLogical from '../operators/query/logical'
import * as projectionOperators from '../operators/projection'

// helpers
import { useOperators, OperatorType } from '../core'

/**
 * Enable default operators. This includes only query and projection operators
 */
function enableDefaultOperators() {
  useOperators(OperatorType.EXPRESSION, Object.assign({}, booleanOperators, comparsonOperators))
  useOperators(OperatorType.PIPELINE, { $project, $skip, $limit, $sort })
  useOperators(OperatorType.PROJECTION, projectionOperators)
  useOperators(OperatorType.QUERY, Object.assign({}, queryArray, queryComparison, queryElement, queryEvaluation, queryLogical))
}

enableDefaultOperators()