import './polyfill'
import { _internal, setup } from './internal'
import { Query, find, remove } from './query'
import { Aggregator, aggregate } from './aggregator'
import { CollectionMixin } from './mixin'
import { Cursor } from './cursor'
import { addOperators, OP_AGGREGATE, OP_GROUP, OP_PIPELINE, OP_PROJECTION, OP_QUERY } from './operators/index'

const VERSION = '1.3.2'

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
  remove,
  setup
}
