import {
  getOperator,
  initOptions,
  OperatorType,
  Options,
  ProcessingMode
} from "./core";
import { Iterator, Lazy, Source } from "./lazy";
import { Callback, RawObject } from "./types";
import { assert, cloneDeep, intersection, isEmpty } from "./util";

/**
 * Provides functionality for the mongoDB aggregation pipeline
 *
 * @param pipeline an Array of pipeline operators
 * @param options An optional Options to pass the aggregator
 * @constructor
 */
export class Aggregator {
  private readonly options: Options;
  constructor(
    private readonly pipeline: Array<RawObject>,
    options?: Partial<Options>
  ) {
    this.options = initOptions(options);
  }

  /**
   * Returns an `Lazy` iterator for processing results of pipeline
   *
   * @param {*} collection An array or iterator object
   * @param {Query} query the `Query` object to use as context
   * @returns {Iterator} an iterator object
   */
  stream(collection: Source): Iterator {
    let iterator: Iterator = Lazy(collection);
    const mode = this.options.processingMode;
    if (
      mode == ProcessingMode.CLONE_ALL ||
      mode == ProcessingMode.CLONE_INPUT
    ) {
      iterator.map(cloneDeep);
    }

    const pipelineOperators: string[] = [];
    if (!isEmpty(this.pipeline)) {
      // run aggregation pipeline
      for (const operator of this.pipeline) {
        const operatorKeys = Object.keys(operator);
        const op = operatorKeys[0];
        const call = getOperator(
          OperatorType.PIPELINE,
          op
        ) as Callback<Iterator>;
        assert(
          operatorKeys.length === 1 && !!call,
          `invalid aggregation operator ${op}`
        );
        pipelineOperators.push(op);
        iterator = call(iterator, operator[op], this.options);
      }
    }

    // operators that may share object graphs of inputs.
    // we only need to clone the output for these since the objects will already be distinct for other operators.
    if (
      mode == ProcessingMode.CLONE_OUTPUT ||
      (mode == ProcessingMode.CLONE_ALL &&
        !!intersection([["$group", "$unwind"], pipelineOperators]).length)
    ) {
      iterator.map(cloneDeep);
    }

    return iterator;
  }

  /**
   * Return the results of the aggregation as an array.
   *
   * @param {*} collection
   * @param {*} query
   */
  run(collection: Source): RawObject[] {
    return this.stream(collection).value();
  }
}
