// loads basic operators
import "./init/basic";

import { Aggregator } from "./aggregator";
import { Options } from "./core";
import { Cursor } from "./cursor";
import { Source } from "./lazy";
import { Query } from "./query";
import { RawObject } from "./types";

export { Aggregator } from "./aggregator";
export { Query } from "./query";

/**
 * Performs a query on a collection and returns a cursor object.
 * Shorthand for `Query(criteria).find(collection, projection)`
 *
 * @param collection Array of objects
 * @param criteria Query criteria
 * @param projection Projection criteria
 * @param options
 * @returns {Cursor} A cursor of results
 */
export function find(
  collection: Source,
  criteria: RawObject,
  projection?: RawObject,
  options?: Partial<Options>
): Cursor {
  return new Query(criteria, options).find(collection, projection);
}

/**
 * Returns a new array without objects which match the criteria
 *
 * @param collection Array of objects
 * @param criteria Query criteria of objects to remove
 * @param options
 * @returns {Array} New filtered array
 */
export function remove(
  collection: RawObject[],
  criteria: RawObject,
  options?: Options
): RawObject[] {
  return new Query(criteria, options).remove(collection);
}

/**
 * Return the result collection after running the aggregation pipeline for the given collection.
 * Shorthand for `(new Aggregator(pipeline, options)).run(collection)`
 *
 * @param collection array or stream of objects
 * @param pipeline The pipeline operators to use
 * @param options
 * @returns {Array} New array of results
 */
export function aggregate(
  collection: Source,
  pipeline: RawObject[],
  options?: Partial<Options>
): RawObject[] {
  return new Aggregator(pipeline, options).run(collection);
}

// default interface
export default {
  Aggregator,
  Query,
  aggregate,
  find,
  remove
};
