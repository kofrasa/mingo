import { Aggregator } from "./aggregator";
import { CollationSpec, Options } from "./core";
import { Iterator, Lazy, Source } from "./lazy";
import { AnyVal, Collection, RawArray, RawObject } from "./types";
import { Callback, into, isObject, Predicate } from "./util";

/**
 * Cursor to iterate and perform filtering on matched objects.
 * This object must not be used directly. A cursor may be obtaine from calling `find()` on an instance of `Query`.
 *
 * @param collection The input source of the collection
 * @param predicate A predicate function to test documents
 * @param projection A projection criteria
 * @param options Options
 * @constructor
 */
export class Cursor {
  private readonly operators: Array<RawObject> = [];
  private result: Iterator = null;
  private stack: RawArray = [];

  constructor(
    readonly source: Source,
    readonly predicate: Predicate<AnyVal>,
    readonly projection: RawObject,
    readonly options: Options
  ) {}

  private fetch(): Iterator {
    if (this.result) return this.result;

    // add projection operator
    if (isObject(this.projection)) {
      this.operators.push({ $project: this.projection });
    }

    // filter collection
    this.result = Lazy(this.source).filter(this.predicate);

    if (this.operators.length > 0) {
      this.result = new Aggregator(this.operators, this.options).stream(
        this.result
      );
    }

    return this.result;
  }

  /**
   * Return remaining objects in the cursor as an array. This method exhausts the cursor
   * @returns {Array}
   */
  all(): RawArray {
    return this.fetch().value() as RawArray;
  }

  /**
   * Returns the number of objects return in the cursor. This method exhausts the cursor
   * @returns {Number}
   */
  count(): number {
    return this.all().length;
  }

  /**
   * Returns a cursor that begins returning results only after passing or skipping a number of documents.
   * @param {Number} n the number of results to skip.
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  skip(n: number): Cursor {
    this.operators.push({ $skip: n });
    return this;
  }

  /**
   * Constrains the size of a cursor's result set.
   * @param {Number} n the number of results to limit to.
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  limit(n: number): Cursor {
    this.operators.push({ $limit: n });
    return this;
  }

  /**
   * Returns results ordered according to a sort specification.
   * @param {Object} modifier an object of key and values specifying the sort order. 1 for ascending and -1 for descending
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  sort(modifier: RawObject): Cursor {
    this.operators.push({ $sort: modifier });
    return this;
  }

  /**
   * Specifies the collation for the cursor returned by the `mingo.Query.find`
   * @param {*} spec
   */
  collation(spec: CollationSpec): Cursor {
    into(this.options, { collation: spec });
    return this;
  }

  /**
   * Returns the next document in a cursor.
   * @returns {Object | Boolean}
   */
  next(): AnyVal {
    // empty stack means processing is done
    if (!this.stack) return;

    // yield value obtains in hasNext()
    if (this.stack.length > 0) {
      return this.stack.pop();
    }
    const o = this.fetch().next();

    if (!o.done) return o.value;
    this.stack = null;
    return;
  }

  /**
   * Returns true if the cursor has documents and can be iterated.
   * @returns {boolean}
   */
  hasNext(): boolean {
    if (!this.stack) return false; // done

    // there is a value on stack
    if (this.stack.length > 0) return true;

    const o = this.fetch().next();
    if (o.done) {
      this.stack = null;
    } else {
      this.stack.push(o.value);
    }

    return !!this.stack;
  }

  /**
   * Applies a function to each document in a cursor and collects the return values in an array.
   * @param callback
   * @returns {Array}
   */
  map(callback: Callback<AnyVal>): Collection {
    return this.fetch().map(callback).value() as Collection;
  }

  /**
   * Applies a JavaScript function for every document in a cursor.
   * @param callback
   */
  forEach(callback: Callback<AnyVal>): void {
    this.fetch().each(callback);
  }

  [Symbol.iterator](): Iterator {
    return this.fetch(); /* eslint-disable-line */
  }
}
