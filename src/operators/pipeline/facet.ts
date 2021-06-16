import { Aggregator } from "../../aggregator";
import { Options } from "../../core";
import { Iterator } from "../../lazy";
import { Collection, RawObject } from "../../types";
import { objectMap } from "../../util";

/**
 * Processes multiple aggregation pipelines within a single stage on the same set of input documents.
 * Enables the creation of multi-faceted aggregations capable of characterizing data across multiple dimensions, or facets, in a single stage.
 */
export function $facet(
  collection: Iterator,
  expr: RawObject,
  options?: Options
): Iterator {
  return collection.transform((array: Collection) => {
    return [
      objectMap(expr, (pipeline: Array<RawObject>) =>
        new Aggregator(pipeline, options).run(array)
      ),
    ];
  });
}
