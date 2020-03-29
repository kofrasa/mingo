// all system operators
import * as accumulatorOperators from './accumulator'
import * as expressionOperators from './expression'
import * as pipelineOperators from './pipeline'
import * as queryOperators from './query'
import * as projectionOperators from './projection'

// default operators
import * as booleanOperators from './expression/boolean'
import * as comparsonOperators from './expression/comparison'
import { $project, $skip, $limit, $sort } from './pipeline'
import * as queryArray from './query/array'
import * as queryComparison from './query/comparison'
import * as queryElement from './query/element'
import * as queryEvaluation from './query/evaluation'
import * as queryLogical from './query/logical'

// helpers
import { useOperators, OperatorType } from '../core'

// intialize default operators
export function enableDefaultOperators() {
  useOperators(OperatorType.EXPRESSION, Object.assign({}, booleanOperators, comparsonOperators))
  useOperators(OperatorType.PIPELINE, { $project, $skip, $limit, $sort })
  useOperators(OperatorType.PROJECTION, projectionOperators)
  useOperators(OperatorType.QUERY, Object.assign({}, queryArray, queryComparison, queryElement, queryEvaluation, queryLogical))
}

/**
 * Enable all supported MongoDB operators
 */
export function enableSystemOperators() {
  useOperators(OperatorType.ACCUMULATOR, accumulatorOperators)
  useOperators(OperatorType.EXPRESSION, expressionOperators)
  useOperators(OperatorType.PIPELINE, pipelineOperators)
  useOperators(OperatorType.PROJECTION, projectionOperators)
  useOperators(OperatorType.QUERY, queryOperators)
}

export * as accumulatorOperators from './accumulator'
export * as expressionOperators from './expression'
export * as pipelineOperators from './pipeline'
export * as projectionOperators from './projection'
export * as queryOperators from './query'