declare namespace mingo {
  export const VERSION: string;
  export const OP_EXPRESSION: 'expression';
  export const OP_GROUP: 'group';
  export const OP_PIPELINE: 'pipeline';
  export const OP_PROJECTION: 'projection';
  export const OP_QUERY: 'query';

  export type OperatorClass =
    | 'expression'
    | 'group'
    | 'pipeline'
    | 'projection'
    | 'query';

  export interface MingoOptions {
    key: string;
  }

  // export interface StreamOptions {
  //   objectMode?: boolean;
  // }

  export interface MingoInternal {
    /**
     * Shallow clone an object
     */
    clone<T>(obj: T): T;

    /**
     * Deep clone an object
     */
    cloneDeep<T>(obj: T): T;

    /**
     * Computes the actual value of the expression using the given object as context
     *
     * @param obj The current object from the collection
     * @param expr The expression for the given field
     * @param operator The operator to resolve the field with
     * @param opt {Object} extra options
     */
    computeValue(
      obj: any,
      expr: any,
      operator?: string,
      opt?: { root?: any }
    ): any;

    /**
     * Iterate over an array or object.
     * @param obj An object-like value.
     * @param fn The callback to run per item.
     * @param ctx  The object to use a context.
     */
    each(obj: object, fn: Function, ctx?: any): void;

    /**
     * Generate hash code
     * This selected function is the result of benchmarking various hash functions.
     * This version performs well and can hash 10^6 documents in ~3s with on average 100 collisions.
     */
    getHash(value: any): number;

    /**
     * Returns the key used as the collection's objects ids
     */
    idKey(): string;

    /**
     * Transform values in a collection.
     * @param obj An array/object whose values to transform.
     * @param fn The transform function.
     * @param ctx The value to use as the "this" context for the transform.
     * @return Result object after applying the transform.
     */
    map<T>(
      obj: any,
      fn: (value: any, index: any, obj: any) => T,
      ctx?: any
    ): Array<T>;

    /**
     * Returns the operators defined for the given operator classes.
     */
    ops(...args: string[]): Array<any>;

    /**
     * Reduce any array-like object.
     */
    reduce<T>(
      obj: any,
      fn: (memo: T, value: any, index: any, obj: any) => T,
      accumulator: T
    ): T;

    /**
     * Resolve the value of the field (dot separated) on the given object
     * @param obj The object context.
     * @param selector Dot separated path to field.
     */
    resolve(obj: any, selector: string): any;
    resolve(
      obj: any,
      selector: string,
      opt: { meta: true }
    ): { result: any; depth: number };

    /**
     * Returns the full object to the resolved value given by the selector.
     * This function excludes empty values as they aren't practically useful.
     *
     * @param obj The object context
     * @param selector Dot separated path to field.
     */
    resolveObj(obj: any, selector: string): any;

    assert(condition: any, message: string): void;
    err(s: string): void;
    getType(v: any): string;
    has(obj: any, prop: string): boolean;
    includes(arr: Array<any>, item: any): boolean;
    isArray(v: any): boolean;
    isBoolean(v: any): boolean;
    isDate(v: any): boolean;
    isEmpty(v: any): boolean;
    isEqual(v: any): boolean;
    isFunction(v: any): boolean;
    isNil(v: any): boolean;
    isNull(v: any): boolean;
    isNumber(v: any): boolean;
    isObject(v: any): boolean;
    isRegExp(v: any): boolean;
    isString(v: any): boolean;
    isUndefined(v: any): boolean;
    keys(o: {}): string[];
  }

  /**
   * Exported to the users to allow writing custom operators.
   */
  export function _internal(): MingoInternal;

  /**
   * Register new operators for the given operator category type.
   * @param opClass The operator class to extend.
   * @param fn A function returning an object of new operators.
   */
  export function addOperators(
    opClass: OperatorClass,
    fn: (internal: MingoInternal) => { [op: string]: Function }
  ): void;

  /**
   * Performs aggregation operation using the aggregation pipeline.
   */
  export function aggregate<T>(collection: T[], expressions: any): T[];

  /**
   * Performs a query on a collection and returns a cursor object.
   */
  export function find<T>(collection: T[], criteria: any): Cursor<T>;
  export function find<P>(
    collection: Array<any>,
    criteria: any,
    projection: any
  ): Cursor<P>;

  /**
   * Returns the non-matched objects as a collection from executing a Mingo.Query with the given criteria
   */
  export function remove<T>(collection: T[], criteria: any): T[];

  /**
   * Setup default settings for Mingo
   */
  export function setup(options: Partial<MingoOptions>): void;

  /**
   * Query object to test collection elements with.
   */
  export class Query {
    /**
     * Creates a Query object with the given query criteria.
     * @param criteria The pass criteria for the query.
     * @param projection Optional projection specifiers.
     */
    constructor(criteria: any, projection?: any);

    /**
     * Checks if the object passes the query criteria. Returns true if so, false otherwise.
     */
    test(obj: any): boolean;

    /**
     * Performs a query on a collection and returns a Cursor object.
     */
    find<T>(collection: T[]): Cursor<T>;
    find<P>(collection: Array<any>, projection: any): Cursor<P>;

    /**
     * Remove matching documents from the collection and return the remainder.
     */
    remove<T>(collection: T[]): T[];

    /**
     * Return a Mingo.Stream to filter and transform JSON objects from a readable stream. Use via mingo-stream.
     */
    // stream(options?: StreamOptions): Stream;
  }

  /**
   * A Transform stream that can be piped from/to any readable/writable JSON stream.
   */
  // export class Stream extends Transform {
  //   constructor(query: Query, options?: StreamOptions);
  // }

  /**
   * Aggregator for defining filter using mongoDB aggregation pipeline syntax.
   */
  export class Aggregator {
    /**
     * Creates a Mingo.Aggregator object with a collection of aggregation pipeline expressions.
     * @param operators An array of pipeline operators.
     */
    constructor(operators: Array<any>);

    /**
     * Apply the pipeline operations over the collection by order of the sequence added
     * @param collection an array of objects to process
     * @param query the `Query` object to use as context
     */
    run<P>(collection: Array<any>, query?: Query): P[];
  }

  /**
   * Cursor to iterate and perform filtering on matched objects.
   */
  export class Cursor<T> {
    /**
     * Creates a Mingo.Cursor object which holds the result of applying the query over the collection.
     */
    constructor(collection: T[], query: Query, projection?: any);

    /**
     * Returns all the matched documents in a cursor as a collection.
     */
    all(): T[];

    /**
     * Returns the first documents in a cursor.
     */
    first(): T;

    /**
     * Returns the last document in a cursor
     */
    last(): T;

    /**
     * Returns a count of the documents in a cursor.
     */
    count(): number;

    /**
     * Constrains the size of a cursor's result set.
     * @param n The number of results to limit to.
     * @return Returns the cursor, so you can chain this call.
     */
    limit(n: number): this;

    /**
     * Returns a cursor that begins returning results only after passing or skipping a number of documents.
     * @param n The number of results to skip.
     * @return Returns the cursor, so you can chain this call.
     */
    skip(n: number): this;

    /**
     * Returns results ordered according to a sort specification.
     * @param modifier An object of key and values specifying the sort order. 1 for ascending and -1 for descending.
     * @return Returns the cursor, so you can chain this call.
     */
    sort(modifier: any): this;

    /**
     * Returns the next document in a cursor.
     */
    next(): T | null;

    /**
     * Returns true if the cursor has documents and can be iterated.
     */
    hasNext(): boolean;

    /**
     * Applies a function to each document in a cursor and collects the return values in an array.
     * @param callback
     */
    map<P>(callback: { (document: T, index: number): P }): P[];

    /**
     * Applies a JavaScript function for every document in a cursor.
     */
    forEach(callback: { (document: T, index: number): void }): void;
  }

  /**
   * A mixin object for Backbone.Collection which adds query() and aggregate() methods.
   */
  export interface CollectionMixinInterface<T = object> {
    /**
     * Performs a query on the collection and returns a Mingo.Cursor object.
     */
    query(criteria: any): T[];
    query<P>(criteria: any, projection: any): Array<P>;

    /**
     * Performs aggregation operation using the aggregation pipeline.
     */
    aggregate<P>(expressions: Array<any>): Array<P>;
  }

  /**
   * A mixin object for Backbone.Collection which adds query() and aggregate() methods.
   */
  export const CollectionMixin: CollectionMixinInterface;
}

export default mingo;
