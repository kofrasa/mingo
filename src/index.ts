import { enableSystemOperators } from './operators'

enableSystemOperators()

// public interface
export { setup, addOperators, useOperators, OperatorType } from './core'
export { enableSystemOperators } from './operators'
export { Query, find, remove } from './query'
export { Aggregator, aggregate } from './aggregator'
export { Cursor } from './cursor'
export { Lazy } from './lazy'