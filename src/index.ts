import { enableSystemOperators } from './operators'

enableSystemOperators()

// public interface
export { enableSystemOperators } from './operators'
export { setup, addOperators, useOperators, OP_EXPRESSION, OP_ACCUMULATOR, OP_PIPELINE, OP_PROJECTION, OP_QUERY } from './internal'
export { Query, find, remove } from './query'
export { Aggregator, aggregate } from './aggregator'
export { Cursor } from './cursor'
export { Lazy } from './lazy'