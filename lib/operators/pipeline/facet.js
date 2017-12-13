import { map, clone } from '../../util'
import { aggregate } from '../../aggregator'
import { Lazy } from '../../lazy'

/**
 * Processes multiple aggregation pipelines within a single stage on the same set of input documents.
 * Enables the creation of multi-faceted aggregations capable of characterizing data across multiple dimensions, or facets, in a single stage.
 */
export function $facet (collection, expr) {
  let xs = collection.all()
  let result = map(expr, (pipeline) => aggregate(xs, pipeline))
  return new Lazy(result).value(xs => xs[0])
}