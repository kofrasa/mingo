import { enableSystemOperators } from './operators'
enableSystemOperators()

import { OP_EXPRESSION, OP_GROUP, OP_PIPELINE, OP_PROJECTION, OP_QUERY } from './constants'
import { _internal, setup } from './internal'
import { Query, find, remove } from './query'
import { Aggregator, aggregate } from './aggregator'
import { CollectionMixin } from './mixin'
import { Cursor } from './cursor'
import { addOperators } from './operators'
import { Lazy } from './lazy'

const VERSION = '2.5.3'

// mingo!
export default {
  _internal,
  Aggregator,
  CollectionMixin,
  Cursor,
  Lazy,
  OP_EXPRESSION,
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