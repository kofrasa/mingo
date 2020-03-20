import { Aggregator } from './aggregator'
import { Query } from './query'
import { Cursor } from './cursor'

/**
 * Mixin for Collection types that provide a method `toJSON() -> Array[Object]`
 */
export const CollectionMixin = {

  /**
   * Runs a query and returns a cursor to the result
   * @param criteria
   * @param projection
   * @returns {Cursor}
   */
  query(criteria: object, projection: object): Cursor {
    return new Query(criteria).find(this.toJSON(), projection)
  },

  /**
   * Runs the given aggregation operators on this collection
   * @params pipeline
   * @returns {Array}
   */
  aggregate(pipeline: object[]): object[] {
    return new Aggregator(pipeline).run(this.toJSON())
  }
}