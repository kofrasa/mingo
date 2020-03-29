import { assert, each, isArray, isEmpty, keys } from './util'
import { getOperator, OperatorType } from './internal'
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
  stream(collection: Source): Iterator {
    let iterator: Iterator = Lazy(collection)

    if (!isEmpty(this.__operators)) {
      // run aggregation pipeline
      each(this.__operators, (operator) => {
        let operatorKeys = keys(operator)
        let op = operatorKeys[0]
        let call = getOperator(OperatorType.PIPELINE, op)
        assert(operatorKeys.length === 1 && !!call, `invalid aggregation operator ${op}`)
        iterator = call(iterator, operator[op], this.__options)
      })
    }
    return iterator
  }

  /**
   * Return the results of the aggregation as an array.
   * @param {*} collection
   * @param {*} query
   */
  run(collection: object[]): any[] {
    return this.stream(collection).value()
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
