import { getOperator, makeOptions, OperatorType, Options } from "./core";
import { Cursor } from "./cursor";
import { Source } from "./lazy";
import { AnyVal, Collection, RawObject } from "./types";
import {
  assert,
  Callback,
  inArray,
  isObject,
  isOperator,
  normalize,
} from "./util";

/**
 * An object used to filter input documents
 *
 * @param {Object} criteria The criteria for constructing predicates
 * @param {Options} options Options for use by operators
 * @constructor
 */
export class Query {
  private readonly compiled: Callback<AnyVal>[];

  constructor(
    private readonly criteria: RawObject,
    private readonly options?: Options
  ) {
    this.options = makeOptions(options);
    this.compiled = [];
    this.compile();
  }

  private compile(): void {
    assert(isObject(this.criteria), "query criteria must be an object");

    let whereOperator: { field: string; expr: AnyVal };

    for (const [field, expr] of Object.entries(this.criteria)) {
      if ("$where" === field) {
        whereOperator = { field: field, expr: expr };
      } else if ("$expr" === field) {
        this.processOperator(field, field, expr);
      } else if (inArray(["$and", "$or", "$nor"], field)) {
        this.processOperator(field, field, expr);
      } else {
        // normalize expression
        assert(!isOperator(field), `unknown top level operator: ${field}`);
        for (const [operator, val] of Object.entries(normalize(expr))) {
          this.processOperator(field, operator, val);
        }
      }

      if (isObject(whereOperator)) {
        this.processOperator(
          whereOperator.field,
          whereOperator.field,
          whereOperator.expr
        );
      }
    }
  }

  private processOperator(
    field: string,
    operator: string,
    value: AnyVal
  ): void {
    const call = getOperator(OperatorType.QUERY, operator);
    assert(!!call, `unknown operator ${operator}`);
    const fn = call(field, value, this.options) as Callback<AnyVal>;
    this.compiled.push(fn);
  }

  /**
   * Checks if the object passes the query criteria. Returns true if so, false otherwise.
   *
   * @param obj The object to test
   * @returns {boolean} True or false
   */
  test(obj: RawObject): boolean {
    for (let i = 0, len = this.compiled.length; i < len; i++) {
      if (!this.compiled[i](obj)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns a cursor to select matching documents from the input source.
   *
   * @param source A source providing a sequence of documents
   * @param projection An optional projection criteria
   * @returns {Cursor} A Cursor for iterating over the results
   */
  find(collection: Source, projection?: RawObject): Cursor {
    return new Cursor(
      collection,
      (x: RawObject) => this.test(x),
      projection || {},
      this.options
    );
  }

  /**
   * Remove matched documents from the collection returning the remainder
   *
   * @param collection An array of documents
   * @returns {Array} A new array with matching elements removed
   */
  remove(collection: Collection): Collection {
    return collection.reduce<Collection>((acc: Collection, obj: RawObject) => {
      if (!this.test(obj)) acc.push(obj);
      return acc;
    }, []);
  }
}
