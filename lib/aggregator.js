import { OP_PIPELINE } from './constants'
import { assert, each, err, inArray, isArray, isEmpty, keys } from './util'
import { Query } from './query'
import { ops } from './operators/index.js'
import { pipelineOperators } from './operators/pipeline/index.js'
import { Lazy } from './lazy'

/**
 * Aggregator for defining filter using mongoDB aggregation pipeline syntax
 *
 * @param operators an Array of pipeline operators
 * @constructor
 */
export class Aggregator {

  constructor (operators) {
    this.__operators = operators
  }

  /**
   * Returns an `Lazy` iterator for processing results of pipeline
   *
   * @param {*} source an array or iterator object
   * @param {Query} query the `Query` object to use as context
   * @returns {Iterator} an iterator object
   */
  stream (source, query) {
    source = Lazy(source)

    if (!isEmpty(this.__operators)) {
      // run aggregation pipeline
      each(this.__operators, (operator) => {
        let key = keys(operator)
        assert(key.length === 1 && inArray(ops(OP_PIPELINE), key[0]), `Invalid aggregation operator ${key}`)
        key = key[0]
        if (query && query instanceof Query) {
          source = pipelineOperators[key].call(query, source, operator[key])
        } else {
          source = pipelineOperators[key](source, operator[key])
        }
      })
    }
    return source
  }

  /**
   * Return the results of the aggregation as an array.
   * @param {*} collection
   * @param {*} query
   */
  run (collection, query) {
    return this.stream(collection, query).value()
  }
}

/**
 * Return the result collection after running the aggregation pipeline for the given collection.
 * Shorthand for `agg.run(input).value()`
 *
 * @param collection
 * @param pipeline
 * @returns {Array}
 */
export function aggregate (collection, pipeline) {
  assert(isArray(pipeline), 'Aggregation pipeline must be an array')
  return (new Aggregator(pipeline)).run(collection)
}
