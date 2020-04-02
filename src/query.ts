import {
  assert,
  each,
  inArray,
  isObject,
  isOperator,
  normalize,
  reduce,
  Callback
} from './util'
import { Cursor } from './cursor'
import { getOperator, OperatorType } from './core'
import { Source } from './lazy'

/**
 * Query object to test collection elements with
 * @param criteria the pass criteria for the query
 * @param projection optional projection specifiers
 * @constructor
 */
export class Query {

  private __criteria: object
  private __compiled: Callback<any>[]

  constructor(criteria: object) {
    this.__criteria = criteria
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
    this.__compiled.push(call(field, value))
  }

  /**
   * Checks if the object passes the query criteria. Returns true if so, false otherwise.
   * @param obj
   * @returns {boolean}
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
   * Performs a query on a collection and returns a cursor object.
   * @param collection
   * @param projection
   * @returns {Cursor}
   */
  find(collection: Source, projection?: object): Cursor {
    return new Cursor(collection, x => this.test(x), projection)
  }

  /**
   * Remove matched documents from the collection returning the remainder
   * @param collection
   * @returns {Array}
   */
  remove(collection: object[]): object[] {
    return reduce(collection, (acc, obj) => {
      if (!this.test(obj)) acc.push(obj)
      return acc
    }, [])
  }
}