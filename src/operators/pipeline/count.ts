import { Options } from "../../core";
import { Iterator, Lazy } from "../../lazy";
import { assert, isString } from "../../util";

/**
 * Returns a document that contains a count of the number of documents input to the stage.
 *
 * @param {Array} collection
 * @param {String} expr
 * @param {Options} options
 * @return {Object}
 */
export function $count(
  collection: Iterator,
  expr: string,
  _: Options
): Iterator {
  assert(
    isString(expr) &&
      expr.trim() !== "" &&
      expr.indexOf(".") === -1 &&
      expr.trim()[0] !== "$",
    "Invalid expression value for $count"
  );

  return Lazy([
    {
      [expr]: collection.size()
    }
  ]);
}
