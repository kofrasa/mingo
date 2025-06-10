// loads basic operators
import "./init/basic";

import { Aggregator } from "./aggregator";
import { Options, ProcessingMode } from "./core";
import { Cursor } from "./cursor";
import { Source } from "./lazy";
import { Query } from "./query";
import { AnyObject } from "./types";
import { createUpdater, update } from "./updater";

export { Aggregator } from "./aggregator";
export { ProcessingMode } from "./core";
export { Query } from "./query";
export { createUpdater, update } from "./updater";

/**
 * Finds documents in a collection that match the specified criteria.
 *
 * @template T - The type of the documents in the collection.
 * @param collection - The source collection to search.
 * @param criteria - The query criteria to filter the documents.
 * @param projection - Optional. Specifies the fields to include or exclude in the returned documents.
 * @param options - Optional. Additional options to customize the query behavior.
 * @returns A `Cursor` object that allows iteration over the matching documents.
 */
export function find<T>(
  collection: Source,
  criteria: AnyObject,
  projection?: AnyObject,
  options?: Partial<Options>
): Cursor<T> {
  return new Query(criteria, options).find<T>(collection, projection);
}

/**
 * Tests if a document matches the specified criteria.
 *
 * @template T - The type of the object to test.
 * @param obj - The object to be tested against the compiled predicates.
 * @param predicates - The predicates the object should satisfies.
 * @returns `true` if the object satisfies all predicates, otherwise `false`.
 */
export function test<T>(
  obj: T,
  predicates: AnyObject,
  options?: Partial<Options>
): boolean {
  return new Query(predicates, options).test<T>(obj);
}

/**
 * Performs an aggregation operation on the provided collection using the specified pipeline.
 *
 * @param collection - The input data source to aggregate.
 * @param pipeline - An array of aggregation stages to process the collection.
 * @param options - Optional settings to customize the aggregation behavior.
 * @returns The result of the aggregation as an array of objects.
 */
export function aggregate(
  collection: Source,
  pipeline: AnyObject[],
  options?: Partial<Options>
): AnyObject[] {
  return new Aggregator(pipeline, options).run(collection);
}

// default interface for ES6 modules
export default {
  Aggregator,
  ProcessingMode,
  Query,
  aggregate,
  createUpdater,
  find,
  test,
  update
};
