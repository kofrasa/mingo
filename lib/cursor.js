import { assert, each, has, isArray, isObject } from './util'
import { Aggregator } from './aggregator'
import { groupOperators } from './operators/group.js'

/**
 * Cursor to iterate and perform filtering on matched objects
 * @param collection
 * @param query
 * @param projection
 * @constructor
 */
export class Cursor {

  constructor (collection, query, projection) {
    this.__query = query
    this.__collection = collection
    this.__projection = projection || query.__projection
    this.__operators = {}
    this.__result = false
    this.__position = 0
  }

  _fetch () {

    if (this.__result !== false) {
      return this.__result
    }

    // inject projection operator
    if (isObject(this.__projection)) {
      Object.assign(this.__operators, { '$project': this.__projection })
    }

    assert(isArray(this.__collection), 'Input collection is not of valid type. Must be an Array.');

    // filter collection
    this.__result = this.__collection.filter(this.__query.test, this.__query)
    let pipeline = []

    each(['$sort', '$skip', '$limit', '$project'], (op) => {
      if (has(this.__operators, op)) {
        let selected = {}
        selected[op] = this.__operators[op]
        pipeline.push(selected)
      }
    })

    if (pipeline.length > 0) {
      let aggregator = new Aggregator(pipeline)
      this.__result = aggregator.run(this.__result, this.__query)
    }
    return this.__result
  }

  /**
   * Fetch and return all matched results
   * @returns {Array}
   */
  all () {
    return this._fetch()
  }

  /**
   * Fetch and return the first matching result
   * @returns {Object}
   */
  first () {
    return this.count() > 0 ? this._fetch()[0] : null
  }

  /**
   * Fetch and return the last matching object from the result
   * @returns {Object}
   */
  last () {
    return this.count() > 0 ? this._fetch()[this.count() - 1] : null
  }

  /**
   * Counts the number of matched objects found
   * @returns {Number}
   */
  count () {
    return this._fetch().length
  }

  /**
   * Returns a cursor that begins returning results only after passing or skipping a number of documents.
   * @param {Number} n the number of results to skip.
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  skip (n) {
    Object.assign(this.__operators, { '$skip': n })
    return this
  }

  /**
   * Constrains the size of a cursor's result set.
   * @param {Number} n the number of results to limit to.
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  limit (n) {
    Object.assign(this.__operators, { '$limit': n })
    return this
  }

  /**
   * Returns results ordered according to a sort specification.
   * @param {Object} modifier an object of key and values specifying the sort order. 1 for ascending and -1 for descending
   * @return {Cursor} Returns the cursor, so you can chain this call.
   */
  sort (modifier) {
    Object.assign(this.__operators, { '$sort': modifier })
    return this
  }

  /**
   * Returns the next document in a cursor.
   * @returns {Object | Boolean}
   */
  next () {
    if (this.hasNext()) {
      return this._fetch()[this.__position++]
    }
    return null
  }

  /**
   * Returns true if the cursor has documents and can be iterated.
   * @returns {boolean}
   */
  hasNext () {
    return this.count() > this.__position
  }

  /**
   * Specifies the exclusive upper bound for a specific field
   * @param expr
   * @returns {Number}
   */
  max (expr) {
    return groupOperators.$max(this._fetch(), expr)
  }

  /**
   * Specifies the inclusive lower bound for a specific field
   * @param expr
   * @returns {Number}
   */
  min (expr) {
    return groupOperators.$min(this._fetch(), expr)
  }

  /**
   * Applies a function to each document in a cursor and collects the return values in an array.
   * @param callback
   * @returns {Array}
   */
  map (callback) {
    return this._fetch().map(callback)
  }

  /**
   * Applies a JavaScript function for every document in a cursor.
   * @param callback
   */
  forEach (callback) {
    each(this._fetch(), callback)
  }

  /**
   * Applies an [ES2015 Iteration protocol][] compatible implementation
   * [ES2015 Iteration protocol]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
   * @returns {Object}
   */
  [Symbol.iterator] () {
    let self = this
    return {
      next () {
        if (!self.hasNext()) {
          return { done: true }
        }
        return {
          done: false,
          value: self.next()
        }
      }
    }
  }
}

