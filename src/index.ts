import { Query } from './query'
import { Aggregator } from './aggregator'
import { Cursor } from './cursor'

// loads all default operators
import './init'

export { Query } from './query'
export { Aggregator } from './aggregator'

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
  aggregate,
  find,
  remove
}