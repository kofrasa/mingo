require('core-js/fn/array/find')
require('core-js/fn/array/find-index')
require('core-js/fn/array/includes')
require('core-js/fn/object/assign')
require('core-js/fn/object/keys')
require('core-js/fn/object/values')
require('core-js/fn/function/bind')
require('core-js/fn/symbol/iterator')

import { Query, find, remove } from './query'
import { Aggregator, aggregate } from './aggregator'
import { CollectionMixin } from './mixin'

// Mingo! :)
export { _internal } from './internal'
export { addOperators, OP_AGGREGATE, OP_GROUP, OP_PIPELINE, OP_PROJECTION, OP_QUERY } from './operators/index'
export { Aggregator, aggregate } from './aggregator'
export { Cursor } from './cursor'
export { Query, find, remove } from './query'
export { CollectionMixin }
export const VERSION = '2.0.0'
