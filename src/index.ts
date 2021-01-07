// loads basic operators
import "./init/basic";

import { Aggregator } from "./aggregator";
import { Cursor } from "./cursor";
import { Source } from "./lazy";
import { Query } from "./query";
import { RawArray, RawObject } from "./util";

export { Aggregator } from "./aggregator";
export { Query } from "./query";

/**
 * Performs a query on a collection and returns a cursor object.
 * Shorthand for `Query(criteria).find(collection, projection)`
 *
 * @param collection Array of objects
 * @param criteria Query criteria
 * @param projection Projection criteria
 * @returns {Cursor} A cursor of results
 */
export function find(
  collection: Source,
  criteria: RawObject,
  projection?: RawObject
): Cursor {
  return new Query(criteria).find(collection, projection);
}

/**
 * Returns a new array without objects which match the criteria
 *
 * @param collection Array of objects
 * @param criteria Query criteria of objects to remove
 * @returns {Array} New filtered array
 */
export function remove(
  collection: RawObject[],
  criteria: RawObject
): RawObject[] {
  return new Query(criteria).remove(collection);
}

/**
 * Return the result collection after running the aggregation pipeline for the given collection.
 * Shorthand for `(new Aggregator(pipeline, options)).run(collection)`
 *
 * @param {Array} collection Collection or stream of objects
 * @param {Array} pipeline The pipeline operators to use
 * @returns {Array} New array of results
 */
export function aggregate(
  collection: Source,
  pipeline: Array<RawObject>
): RawArray {
  return new Aggregator(pipeline).run(collection);
}

// default interface
export default {
  Aggregator,
  Query,
  aggregate,
  find,
  remove,
};
