import { addOperators, useOperators, OperatorType } from './core'
import { enableDefaultOperators, enableSystemOperators } from './operators'
import { Query } from './query'
import { Aggregator } from './aggregator'
import { Cursor } from './cursor'
import { Lazy } from './lazy'

// Starting in 3.0.0 only Query and Projection operators are enabled by default.
// If the default import is not used, the operators must be manually enabled.
// All system operators can be enabled via `enableSystemOperators`.
// Operators may also be selectively imported from the 'operators' module to support tree-shaking.
enableDefaultOperators()

export { addOperators, useOperators, OperatorType } from './core'
export { enableDefaultOperators, enableSystemOperators } from './operators'
export { Query } from './query'
export { Aggregator } from './aggregator'
export { Cursor } from './cursor'
export { Lazy } from './lazy'


/**
 * Performs a query on a collection and returns a cursor object.
 * Shorthand for `Query(criteria).find(collection, projection)`
 *
 * @param collection Array of objects
 * @param criteria Query criteria
 * @param projection Projection criteria
 * @returns {Cursor} A cursor of results
 */
export function find(collection: object[], criteria: object, projection?: object): Cursor {
  return new Query(criteria).find(collection, projection)
}

/**
 * Returns a new array without objects which match the criteria
 *
 * @param collection Array of objects
 * @param criteria Query criteria of objects to remove
 * @returns {Array} New filtered array
 */
export function remove(collection: object[], criteria: object): object[] {
  return new Query(criteria).remove(collection)
}

/**
 * Return the result collection after running the aggregation pipeline for the given collection.
 * Shorthand for `(new Aggregator(pipeline, options)).run(collection)`
 *
 * @param {Array} collection Collection or stream of objects
 * @param {Array} pipeline The pipeline operators to use
 * @returns {Array} New array of results
 */
export function aggregate(collection: object[], pipeline: object[]): any[] {
  return (new Aggregator(pipeline)).run(collection)
}


// default interface
export default {
  Aggregator,
  Query,
  Cursor,
  Lazy,
  addOperators,
  aggregate,
  find,
  remove,

  // Deprecated. Preserved for backward-compatibility with 2.x.x. Users should prefer OperatorType
  OP_EXPRESSION: OperatorType.EXPRESSION,
  OP_GROUP: OperatorType.ACCUMULATOR,
  OP_PIPELINE: OperatorType.PIPELINE,
  OP_PROJECTION: OperatorType.PROJECTION,
  OP_QUERY: OperatorType.QUERY,

  // Since 3.0.0
  OperatorType,
  useOperators,
  enableDefaultOperators,
  enableSystemOperators,
}