import { assert, each, err, inArray, isArray, isEmpty, keys } from './util'
import { Query } from './query'
import { ops, OP_PIPELINE } from './operators/index'
import { pipelineOperators } from './operators/pipeline.js'

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
   * Apply the pipeline operations over the collection by order of the sequence added
   *
   * @param collection an array of objects to process
   * @param query the `Query` object to use as context
   * @returns {Array}
   */
  run (collection, query) {
    if (!isEmpty(this.__operators)) {
      // run aggregation pipeline
      each(this.__operators, (operator) => {
        let key = keys(operator)
        if (key.length === 1 && inArray(ops(OP_PIPELINE), key[0])) {
          key = key[0]
          if (query instanceof Query) {
            collection = pipelineOperators[key].call(query, collection, operator[key])
          } else {
            collection = pipelineOperators[key](collection, operator[key])
          }
        } else {
          err("Invalid aggregation operator '" + key + "'")
        }
      })
    }
    return collection
  }
}

/**
 * Return the result collection after running the aggregation pipeline for the given collection
 *
 * @param collection
 * @param pipeline
 * @returns {Array}
 */
export function aggregate (collection, pipeline) {
  assert(isArray(pipeline), 'Aggregation pipeline must be an array')
  return (new Aggregator(pipeline)).run(collection)
}
