import { Options } from "../../core";
import { Iterator } from "../../lazy";

/**
 * Restricts the number of documents in an aggregation pipeline.
 *
 * @param collection
 * @param value
 * @param options
 * @returns {Object|*}
 */
export function $limit(
  collection: Iterator,
  expr: number,
  options: Options
): Iterator {
  return collection.take(expr);
}
