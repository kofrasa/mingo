// $sample operator -  https://docs.mongodb.com/manual/reference/operator/aggregation/sample/

import { Options, PipelineOperator } from "../../core";
import { Iterator, Source } from "../../lazy";
import { Callback, RawArray } from "../../types";

/**
 * Randomly selects the specified number of documents from its input. The given iterator must have finite values
 *
 * @param  {Iterator} collection
 * @param  {Object} expr
 * @param  {Options} _options
 * @return {*}
 */
export const $sample: PipelineOperator = (
  collection: Iterator,
  expr: { size: number },
  _options: Options
): Iterator => {
  return collection.transform(((xs: RawArray) => {
    const len = xs.length;
    let i = -1;
    return () => {
      if (++i === expr.size) return { done: true };
      const n = Math.floor(Math.random() * len);
      return { value: xs[n], done: false };
    };
  }) as Callback<Source>);
};
