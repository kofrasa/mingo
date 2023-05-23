import { Options } from "../../core";
import { Iterator } from "../../lazy";

/**
 * Skips over a specified number of documents from the pipeline and returns the rest.
 *
 * @param collection An iterator
 * @param expr
 * @param  {Options} options
 * @returns {*}
 */
export function $skip(
  collection: Iterator,
  expr: number,
  options: Options
): Iterator {
  return collection.drop(expr);
}
