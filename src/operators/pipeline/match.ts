import { Options } from "../../core";
import { Iterator } from "../../lazy";
import { Query } from "../../query";
import { RawObject } from "../../types";

/**
 * Filters the document stream, and only allows matching documents to pass into the next pipeline stage.
 * $match uses standard MongoDB queries.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {Array|*}
 */
export function $match(
  collection: Iterator,
  expr: RawObject,
  options: Options
): Iterator {
  const q = new Query(expr, options);
  return collection.filter((o: RawObject) => q.test(o));
}
