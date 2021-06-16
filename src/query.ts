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
  private __criteria: RawObject;
  private __compiled: Callback<AnyVal>[];
  private __options: Options;

  constructor(criteria: RawObject, options?: Options) {
    this.__criteria = criteria;
    this.__options = makeOptions(options);
    this.__compiled = [];
    this._compile();
  }

  _compile(): void {
    assert(isObject(this.__criteria), "query criteria must be an object");

    let whereOperator: { field: string; expr: AnyVal };

    for (const [field, expr] of Object.entries(this.__criteria)) {
      if ("$where" === field) {
        whereOperator = { field: field, expr: expr };
      } else if ("$expr" === field) {
        this._processOperator(field, field, expr);
      } else if (inArray(["$and", "$or", "$nor"], field)) {
        this._processOperator(field, field, expr);
      } else {
        // normalize expression
        assert(!isOperator(field), `unknown top level operator: ${field}`);
        for (const [operator, val] of Object.entries(normalize(expr))) {
          this._processOperator(field, operator, val);
        }
      }

      if (isObject(whereOperator)) {
        this._processOperator(
          whereOperator.field,
          whereOperator.field,
          whereOperator.expr
        );
      }
    }
  }

  _processOperator(field: string, operator: string, value: AnyVal): void {
    const call = getOperator(OperatorType.QUERY, operator);
    assert(!!call, `unknown operator ${operator}`);
    const fn = call(field as AnyVal, value, this.__options) as Callback<AnyVal>;
    this.__compiled.push(fn);
  }

  /**
   * Checks if the object passes the query criteria. Returns true if so, false otherwise.
   *
   * @param obj The object to test
   * @returns {boolean} True or false
   */
  test(obj: RawObject): boolean {
    for (let i = 0, len = this.__compiled.length; i < len; i++) {
      if (!this.__compiled[i](obj)) {
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
      this.__options
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
