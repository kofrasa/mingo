// $sample operator -  https://docs.mongodb.com/manual/reference/operator/aggregation/sample/

import { Options } from "../../core";
import { Iterator } from "../../lazy";
import { assert, isNumber, RawArray, RawObject } from "../../util";

/**
 * Randomly selects the specified number of documents from its input. The given iterator must have finite values
 *
 * @param  {Iterator} collection
 * @param  {Object} expr
 * @param  {Options} options
 * @return {*}
 */
export function $sample(
  collection: Iterator,
  expr: RawObject,
  options?: Options
): Iterator {
  const size = expr.size;
  assert(isNumber(size), "$sample size must be a positive integer");

  return collection.transform((xs: RawArray) => {
    const len = xs.length;
    let i = -1;
    return () => {
      if (++i === size) return { done: true };
      const n = Math.floor(Math.random() * len);
      return { value: xs[n], done: false };
    };
  });
}
