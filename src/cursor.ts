import { ProcessingMode } from "./core/_internal";
import { concat, Iterator, Lazy, Source } from "./lazy";
import { $limit } from "./operators/pipeline/limit";
import { $project } from "./operators/pipeline/project";
import { $skip } from "./operators/pipeline/skip";
import { $sort } from "./operators/pipeline/sort";
import type {
  AnyObject,
  Callback,
  CollationSpec,
  Options,
  PipelineOperator,
  Predicate,
  Projection
} from "./types";
import { cloneDeep, has } from "./util";

const OPERATORS: Record<string, PipelineOperator> = { $sort, $skip, $limit };

/**
 * The `Cursor` class provides a mechanism for iterating over a collection of data
 * with support for filtering, projection, sorting, skipping, and limiting results.
 * It is designed to be chainable and supports lazy evaluation for efficient data processing.
 *
 * @template T - The type of the elements in the cursor.
 */
export class Cursor<T> {
  #source: Source;
  #predicate: Predicate;
  #projection: Projection<T>;
  #options: Options;
  #operators: AnyObject = {};
  #result: Iterator | null = null;
  #buffer: T[] = [];

  /**
   * Creates an instance of the Cursor class.
   *
   * @param source - The source of data to be iterated over.
   * @param predicate - A function or condition to filter the data.
   * @param projection - An object specifying the fields to include or exclude in the result.
   * @param options - Optional settings to customize the behavior of the cursor.
   */
  constructor(
    source: Source,
    predicate: Predicate,
    projection: Projection<T>,
    options: Options
  ) {
    this.#source = source;
    this.#predicate = predicate;
    this.#projection = projection;
    this.#options = options;
  }

  /** Returns the iterator from running the query */
  private fetch(): Iterator {
    if (this.#result) return this.#result;

    // apply filter
    this.#result = Lazy(this.#source).filter(this.#predicate);
    const mode = this.#options.processingMode;

    // handle processing flag.
    if (mode & ProcessingMode.CLONE_INPUT) this.#result.map(o => cloneDeep(o));

    // apply cursor operators
    for (const op of Object.keys(OPERATORS)) {
      if (has(this.#operators, op)) {
        const f = OPERATORS[op] as Callback<Iterator>;
        this.#result = f(this.#result, this.#operators[op], this.#options);
      }
    }
    // apply projection
    if (Object.keys(this.#projection).length) {
      this.#result = $project(this.#result, this.#projection, this.#options);
    }

    if (mode & ProcessingMode.CLONE_OUTPUT) this.#result.map(o => cloneDeep(o));

    return this.#result;
  }

  /** Returns an iterator with the buffered data included */
  private fetchAll(): Iterator {
    const buffered = Lazy(Array.from(this.#buffer));
    this.#buffer.length = 0;
    return concat(buffered, this.fetch());
  }

  /**
   * Return remaining objects in the cursor as an array. This method exhausts the cursor
   * @returns {Array}
   */
  all(): T[] {
    return this.fetchAll().collect();
  }

  /**
   * Returns a cursor that begins returning results only after passing or skipping a number of documents.
   * @param {Number} n the number of results to skip.
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  skip(n: number): Cursor<T> {
    this.#operators["$skip"] = n;
    return this;
  }

  /**
   * Limits the number of items returned by the cursor.
   *
   * @param n - The maximum number of items to return.
   * @returns The current cursor instance for chaining.
   */
  limit(n: number): Cursor<T> {
    this.#operators["$limit"] = n;
    return this;
  }

  /**
   * Returns results ordered according to a sort specification.
   * @param {AnyObject} modifier an object of key and values specifying the sort order. 1 for ascending and -1 for descending
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */

  sort(modifier: AnyObject): Cursor<T> {
    this.#operators["$sort"] = modifier;
    return this;
  }

  /**
   * Sets the collation options for the cursor.
   * Collation allows users to specify language-specific rules for string comparison,
   * such as case sensitivity and accent marks.
   *
   * @param spec - The collation specification to apply.
   * @returns The current cursor instance for chaining.
   */
  collation(spec: CollationSpec): Cursor<T> {
    this.#options = { ...this.#options, collation: spec };
    return this;
  }

  /**
   * Retrieves the next item in the cursor.
   */
  next(): T {
    // yield value obtains in hasNext()
    if (this.#buffer.length > 0) {
      return this.#buffer.pop()!;
    }
    const o = this.fetch().next();
    if (o.done) return undefined as T;
    return o.value as T;
  }

  /**
   * Determines if there are more elements available in the cursor.
   *
   * @returns {boolean} `true` if there are more elements to iterate over, otherwise `false`.
   */
  hasNext(): boolean {
    // there is a value in the buffer
    if (this.#buffer.length > 0) return true;

    const o = this.fetch().next();
    if (o.done) return false;

    this.#buffer.push(o.value as T);
    return true;
  }

  /**
   * Returns an iterator for the cursor, allowing it to be used in `for...of` loops.
   * The iterator fetches all the results from the cursor.
   *
   * @returns {Iterator} An iterator over the fetched results.
   */
  [Symbol.iterator](): Iterator {
    return this.fetchAll();
  }
}
