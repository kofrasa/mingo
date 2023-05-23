// $sample operator -  https://docs.mongodb.com/manual/reference/operator/aggregation/sample/

import { Options } from "../../core";
import { Iterator, Source } from "../../lazy";
import { Callback, RawArray } from "../../types";

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
  expr: { size: number },
  options: Options
): Iterator {
  return collection.transform(((xs: RawArray) => {
    const len = xs.length;
    let i = -1;
    return () => {
      if (++i === expr.size) return { done: true };
      const n = Math.floor(Math.random() * len);
      return { value: xs[n], done: false };
    };
  }) as Callback<Source>);
}
