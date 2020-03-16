import { enableSystemOperators } from './operators'
enableSystemOperators()

// public interface
export { OP_EXPRESSION, OP_GROUP, OP_PIPELINE, OP_PROJECTION, OP_QUERY } from './constants'
export { _internal, setup } from './internal'
export { Query, find, remove } from './query'
export { Aggregator, aggregate } from './aggregator'
export { CollectionMixin } from './mixin'
export { Cursor } from './cursor'
export { addOperators } from './operators'
export { Lazy } from './lazy'

export const VERSION = '2.5.2'