import { enableSystemOperators } from './operators'

enableSystemOperators()

// public interface
export { enableSystemOperators } from './operators'
export { setup, addOperators, useOperators, OperatorType } from './internal'
export { Query, find, remove } from './query'
export { Aggregator, aggregate } from './aggregator'
export { Cursor } from './cursor'
export { Lazy } from './lazy'