import {
  assert,
  each,
  inArray,
  isObject,
  isOperator,
  normalize,
  Callback
} from './util'
import { Cursor } from './cursor'
import { getOperator, OperatorType, createConfig, Config } from './core'
import { Source } from './lazy'

/**
 * An object used to filter input documents
 *
 * @param criteria The criteria for constructing predicates
 * @param config Optional config
 * @constructor
 */
export class Query {

  private __criteria: object
  private __compiled: Callback<any>[]
  private __config: Config

  constructor(criteria: object, config?: Config) {
    this.__criteria = criteria
    this.__config = createConfig(config)
    this.__compiled = []
    this._compile()
  }

  _compile() {
    assert(isObject(this.__criteria), 'query criteria must be an object')

    let whereOperator: { field: string, expr: object }

    each(this.__criteria, (expr, field) => {
      // save $where operators to be executed after other operators
      if ('$where' === field) {
        whereOperator = { field: field, expr: expr };
      } else if ('$expr' === field) {
        this._processOperator(field, field, expr)
      } else if (inArray(['$and', '$or', '$nor'], field)) {
        this._processOperator(field, field, expr)
      } else {
        // normalize expression
        assert(!isOperator(field), `unknown top level operator: ${field}`)
        expr = normalize(expr)
        each(expr, (val, op) => {
          this._processOperator(field, op, val)
        })
      }

      if (isObject(whereOperator)) {
        this._processOperator(whereOperator.field, whereOperator.field, whereOperator.expr);
      }
    })
  }

  _processOperator(field: string, operator: string, value: any) {
    let call = getOperator(OperatorType.QUERY, operator)
    assert(!!call, `unknown operator ${operator}`)
    this.__compiled.push(call(field, value, this.__config))
  }

  /**
   * Checks if the object passes the query criteria. Returns true if so, false otherwise.
   *
   * @param obj The object to test
   * @returns {boolean} True or false
   */
  test(obj: any): boolean {
    for (let i = 0, len = this.__compiled.length; i < len; i++) {
      if (!this.__compiled[i](obj)) {
        return false
      }
    }
    return true
  }

  /**
   * Returns a cursor to select matching documents from the input source.
   *
   * @param source A source providing a sequence of documents
   * @param projection An optional projection criteria
   * @returns {Cursor} A Cursor for iterating over the results
   */
  find(collection: Source, projection?: object): Cursor {
    return new Cursor(collection, x => this.test(x), projection || {}, this.__config)
  }

  /**
   * Remove matched documents from the collection returning the remainder
   *
   * @param collection An array of documents
   * @returns {Array} A new array with matching elements removed
   */
  remove(collection: object[]): object[] {
    return collection.reduce<object[]>((acc: object[], obj: object) => {
      if (!this.test(obj)) acc.push(obj)
      return acc
    }, [])
  }
}