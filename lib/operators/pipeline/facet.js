import { objectMap, clone } from '../../util'
import { aggregate } from '../../aggregator'
import { Lazy } from '../../lazy'

/**
 * Processes multiple aggregation pipelines within a single stage on the same set of input documents.
 * Enables the creation of multi-faceted aggregations capable of characterizing data across multiple dimensions, or facets, in a single stage.
 */
export function $facet (collection, expr) {
  return collection.transform(array => {
    return [ objectMap(expr, pipeline => aggregate(array, pipeline)) ]
  }).first()
}