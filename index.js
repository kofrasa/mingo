// mingo!
export { OP_EXPRESSION, OP_GROUP, OP_PIPELINE, OP_PROJECTION, OP_QUERY } from './lib/constants'
export { _internal, setup } from './lib/internal'
export { Query, find, remove } from './lib/query'
export { Aggregator, aggregate } from './lib/aggregator'
export { CollectionMixin } from './lib/mixin'
export { Cursor } from './lib/cursor'
export { addOperators } from './lib/operators/index'
export { Lazy } from './lib/lazy'

export const VERSION = '2.5.0'