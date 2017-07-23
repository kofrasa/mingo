require('core-js/fn/array/find')
require('core-js/fn/array/find-index')
require('core-js/fn/array/includes')
require('core-js/fn/object/assign')
require('core-js/fn/object/keys')
require('core-js/fn/object/values')
require('core-js/fn/function/bind')
require('core-js/fn/symbol/iterator')

import { _internal } from './internal'
import { Query, find, remove } from './query'
import { Aggregator, aggregate } from './aggregator'
import { CollectionMixin } from './mixin'
import { Cursor } from './cursor'
import { addOperators, OP_AGGREGATE, OP_GROUP, OP_PIPELINE, OP_PROJECTION, OP_QUERY } from './operators/index'

const VERSION = '1.3.0'

// mingo!
export default {
  _internal,
  Aggregator,
  CollectionMixin,
  Cursor,
  OP_AGGREGATE,
  OP_GROUP,
  OP_PIPELINE,
  OP_PROJECTION,
  OP_QUERY,
  Query,
  VERSION,
  addOperators,
  aggregate,
  find,
  remove
}
