import { Options } from "../../core";
import { Iterator } from "../../lazy";
import { assert, isArray, RawArray, RawObject } from "../../util";

/**
 * Takes the documents returned by the aggregation pipeline and writes them to a specified collection.
 *
 * Unlike the $out operator in MongoDB, this operator can appear in any position in the pipeline and is
 * useful for collecting intermediate results of an aggregation operation.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {*}
 */
export function $out(
  collection: Iterator,
  expr: RawArray,
  options?: Options
): Iterator {
  assert(isArray(expr), "$out expression must be an array");
  return collection.map((o: RawObject) => {
    expr.push(o);
    return o; // passthrough
  });
}
