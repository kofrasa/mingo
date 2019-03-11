import { OP_PIPELINE } from './constants'
import { assert, each, inArray, isArray, isEmpty, keys } from './util'
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

  constructor (operators, options) {
    this.__operators = operators
    this.__options = options
  }

  /**
   * Returns an `Lazy` iterator for processing results of pipeline
   *
   * @param {*} collection An array or iterator object
   * @param {Query} query the `Query` object to use as context
   * @returns {Iterator} an iterator object
   */
  stream (collection, query) {
    collection = Lazy(collection)

    if (!isEmpty(this.__operators)) {
      // run aggregation pipeline
      each(this.__operators, (operator) => {
        let key = keys(operator)
        assert(key.length === 1 && inArray(ops(OP_PIPELINE), key[0]), `invalid aggregation operator ${key}`)
        key = key[0]
        if (query && query instanceof Query) {
          collection = pipelineOperators[key].call(query, collection, operator[key], this.__options)
        } else {
          collection = pipelineOperators[key](collection, operator[key], this.__options)
        }
      })
    }
    return collection
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
 * Shorthand for `(new Aggregator(pipeline, options)).run(collection)`
 *
 * @param {Array} collection Collection or stream of objects
 * @param {Array} pipeline The pipeline operators to use
 * @returns {Array}
 */
export function aggregate (collection, pipeline, options) {
  assert(isArray(pipeline), 'Aggregation pipeline must be an array')
  return (new Aggregator(pipeline, options)).run(collection)
}
