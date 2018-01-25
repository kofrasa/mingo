import { assert, each, has, isArray, isObject } from './util'
import { Aggregator } from './aggregator'
import { groupOperators } from './operators/group/index.js'
import { Lazy } from './lazy'

/**
 * Cursor to iterate and perform filtering on matched objects
 * @param collection
 * @param query
 * @param projection
 * @constructor
 */
export class Cursor {

  constructor (source, query, projection) {
    this.__filterFn = query.test.bind(query)
    this.__query = query
    this.__source = source
    this.__projection = projection || query.__projection
    this.__operators = []
    this.__result = null
    this.__stack = []
  }

  _fetch () {

    if (!!this.__result) return this.__result

    // add projection operator
    if (isObject(this.__projection)) this.__operators.push({ '$project': this.__projection })

    // filter collection
    this.__result = Lazy(this.__source).filter(this.__filterFn)

    if (this.__operators.length > 0) {
      this.__result = (new Aggregator(this.__operators)).stream(this.__result, this.__query)
    }

    return this.__result
  }

  /**
   * Return remaining objects in the cursor as an array. This method exhausts the cursor
   * @returns {Array}
   */
  all () {
    return this._fetch().value()
  }

  /**
   * Returns the number of objects return in the cursor. This method exhausts the cursor
   * @returns {Number}
   */
  count () {
    return this.all().length
  }

  /**
   * Returns a cursor that begins returning results only after passing or skipping a number of documents.
   * @param {Number} n the number of results to skip.
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  skip (n) {
    this.__operators.push({ '$skip': n })
    return this
  }

  /**
   * Constrains the size of a cursor's result set.
   * @param {Number} n the number of results to limit to.
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  limit (n) {
    this.__operators.push({ '$limit': n })
    return this
  }

  /**
   * Returns results ordered according to a sort specification.
   * @param {Object} modifier an object of key and values specifying the sort order. 1 for ascending and -1 for descending
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  sort (modifier) {
    this.__operators.push({ '$sort': modifier })
    return this
  }

  /**
   * Returns the next document in a cursor.
   * @returns {Object | Boolean}
   */
  next () {
    if (!this.__stack) return // done
    if (this.__stack.length > 0) return this.__stack.pop() // yield value obtains in hasNext()
    let o = this._fetch().next()

    if (!o.done) return o.value
    this.__stack = null
    return
  }

  /**
   * Returns true if the cursor has documents and can be iterated.
   * @returns {boolean}
   */
  hasNext () {
    if (!this.__stack) return false // done
    if (this.__stack.length > 0) return true // there is a value on stack

    let o = this._fetch().next()
    if (!o.done) {
      this.__stack.push(o.value)
    } else {
      this.__stack = null
    }

    return !!this.__stack
  }

  /**
   * Applies a function to each document in a cursor and collects the return values in an array.
   * @param callback
   * @returns {Array}
   */
  map (callback) {
    return this._fetch().map(callback).value()
  }

  /**
   * Applies a JavaScript function for every document in a cursor.
   * @param callback
   */
  forEach (callback) {
    this._fetch().each(callback)
  }

  /**
   * Applies an [ES2015 Iteration protocol][] compatible implementation
   * [ES2015 Iteration protocol]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
   * @returns {Object}
   */
  [Symbol.iterator] () {
    return this._fetch()
  }
}

