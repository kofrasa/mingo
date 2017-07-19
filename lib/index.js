import { err, isArray } from './util'
import { Query, find, remove } from './query'
import { Aggregator, aggregate } from './aggregator'

/**
 * Mixin for Collection types that provide a method `toJSON() -> Array[Object]`
 */
const CollectionMixin = {

  /**
   * Runs a query and returns a cursor to the result
   * @param criteria
   * @param projection
   * @returns {Cursor}
   */
  query (criteria, projection) {
    return find(this.toJSON(), criteria, projection)
  },

  /**
   * Runs the given aggregation operators on this collection
   * @params pipeline
   * @returns {Array}
   */
  aggregate (pipeline) {
    return aggregate.call(null, this.toJSON(), pipeline)
  }
}


// Mingo global exports
export { _internal } from './internal.js'
export { addOperators, OP_AGGREGATE, OP_GROUP, OP_PIPELINE, OP_PROJECTION, OP_QUERY } from './operators/index.js'
export { Aggregator, aggregate } from './aggregator'
export { Cursor } from './cursor.js'
export { Query, find, remove } from './query'
export { CollectionMixin }
export const VERSION = '@VERSION'

