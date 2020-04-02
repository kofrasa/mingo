import { objectMap } from '../../util'
import { Aggregator } from '../../aggregator'
import { Iterator } from '../../lazy'


/**
 * Processes multiple aggregation pipelines within a single stage on the same set of input documents.
 * Enables the creation of multi-faceted aggregations capable of characterizing data across multiple dimensions, or facets, in a single stage.
 */
export function $facet(collection: Iterator, expr: any, opt?: object): Iterator {
  return collection.transform(array => {
    return [ objectMap(expr, pipeline => new Aggregator(pipeline).run(array)) ]
  })
}