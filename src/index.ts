import * as expressionOperators from './operators/expression'
import * as accumulatorOperators from './operators/group'
import * as pipelineOperators from './operators/pipeline'
import * as projectionOperators from './operators/projection'
import * as queryOperators from './operators/query'
import { enableOperators, OP_EXPRESSION, OP_GROUP, OP_PIPELINE, OP_PROJECTION, OP_QUERY } from './internal'

// setup the system operators
enableOperators(OP_GROUP, accumulatorOperators)
enableOperators(OP_EXPRESSION, expressionOperators)
enableOperators(OP_PIPELINE, pipelineOperators)
enableOperators(OP_PROJECTION, projectionOperators)
enableOperators(OP_QUERY, queryOperators)

// public interface
export { setup, addOperators, OP_EXPRESSION, OP_GROUP, OP_PIPELINE, OP_PROJECTION, OP_QUERY } from './internal'
export { Query, find, remove } from './query'
export { Aggregator, aggregate } from './aggregator'
export { CollectionMixin } from './mixin'
export { Cursor } from './cursor'
export { Lazy } from './lazy'