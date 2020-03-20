import { OP_PIPELINE } from './constants'
import { assert, each, has, isArray, isEmpty, keys } from './util'
import { Query } from './query'
import { OPERATORS } from './operators'
import { Lazy, Iterator, Source } from './lazy'

/**
 * Aggregator for defining filter using mongoDB aggregation pipeline syntax
 *
 * @param operators an Array of pipeline operators
 * @constructor
 */
export class Aggregator {

  private __operators: object[]
  private __options: object

  constructor(operators: object[], options?: object) {
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
  stream(collection: Source, query?: Query): Iterator {
    let iterator: Iterator = Lazy(collection)

    const pipelineOperators = OPERATORS[OP_PIPELINE]

    if (!isEmpty(this.__operators)) {
      // run aggregation pipeline
      each(this.__operators, (operator) => {
        let operatorKeys = keys(operator)
        let key = operatorKeys[0]
        assert(operatorKeys.length === 1 && has(OPERATORS[OP_PIPELINE], key), `invalid aggregation operator ${key}`)
        if (query instanceof Query) {
          iterator = pipelineOperators[key].call(query, iterator, operator[key], this.__options)
        } else {
          iterator = pipelineOperators[key](iterator, operator[key], this.__options)
        }
      })
    }
    return iterator
  }

  /**
   * Return the results of the aggregation as an array.
   * @param {*} collection
   * @param {*} query
   */
  run(collection: object[], query?: Query): any[] {
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
export function aggregate(collection: object[], pipeline: object[], options?: object): any[] {
  assert(isArray(pipeline), 'Aggregation pipeline must be an array')
  return (new Aggregator(pipeline, options)).run(collection)
}
