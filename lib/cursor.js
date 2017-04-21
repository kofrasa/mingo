
/**
 * Cursor to iterate and perform filtering on matched objects
 * @param collection
 * @param query
 * @param projection
 * @constructor
 */
Mingo.Cursor = function (collection, query, projection) {
  if (!(this instanceof Mingo.Cursor)) {
    return new Mingo.Cursor(collection, query, projection)
  }

  this.__query = query
  this.__collection = collection
  this.__projection = projection || query.__projection
  this.__operators = {}
  this.__result = false
  this.__position = 0
}

Mingo.Cursor.prototype = {

  _fetch: function () {
    var self = this

    if (this.__result !== false) {
      return this.__result
    }

    // inject projection operator
    if (isObject(this.__projection)) {
      Object.assign(this.__operators, {'$project': this.__projection})
    }

    if (!isArray(this.__collection)) {
      err('Input collection is not of valid type. Must be an Array.')
    }

    // filter collection
    this.__result = this.__collection.filter(this.__query.test, this.__query)
    var pipeline = []

    each(['$sort', '$skip', '$limit', '$project'], function (op) {
      if (has(self.__operators, op)) {
        var selected = {}
        selected[op] = self.__operators[op]
        pipeline.push(selected)
      }
    })

    if (pipeline.length > 0) {
      var aggregator = new Mingo.Aggregator(pipeline)
      this.__result = aggregator.run(this.__result, this.__query)
    }
    return this.__result
  },

  /**
   * Fetch and return all matched results
   * @returns {Array}
   */
  all: function () {
    return this._fetch()
  },

  /**
   * Fetch and return the first matching result
   * @returns {Object}
   */
  first: function () {
    return this.count() > 0 ? this._fetch()[0] : null
  },

  /**
   * Fetch and return the last matching object from the result
   * @returns {Object}
   */
  last: function () {
    return this.count() > 0 ? this._fetch()[this.count() - 1] : null
  },

  /**
   * Counts the number of matched objects found
   * @returns {Number}
   */
  count: function () {
    return this._fetch().length
  },

  /**
   * Returns a cursor that begins returning results only after passing or skipping a number of documents.
   * @param {Number} n the number of results to skip.
   * @return {Mingo.Cursor} Returns the cursor, so you can chain this call.
   */
  skip: function (n) {
    Object.assign(this.__operators, {'$skip': n})
    return this
  },

  /**
   * Constrains the size of a cursor's result set.
   * @param {Number} n the number of results to limit to.
   * @return {Mingo.Cursor} Returns the cursor, so you can chain this call.
   */
  limit: function (n) {
    Object.assign(this.__operators, {'$limit': n})
    return this
  },

  /**
   * Returns results ordered according to a sort specification.
   * @param {Object} modifier an object of key and values specifying the sort order. 1 for ascending and -1 for descending
   * @return {Mingo.Cursor} Returns the cursor, so you can chain this call.
   */
  sort: function (modifier) {
    Object.assign(this.__operators, {'$sort': modifier})
    return this
  },

  /**
   * Returns the next document in a cursor.
   * @returns {Object | Boolean}
   */
  next: function () {
    if (this.hasNext()) {
      return this._fetch()[this.__position++]
    }
    return null
  },

  /**
   * Returns true if the cursor has documents and can be iterated.
   * @returns {boolean}
   */
  hasNext: function () {
    return this.count() > this.__position
  },

  /**
   * Specifies the exclusive upper bound for a specific field
   * @param expr
   * @returns {Number}
   */
  max: function (expr) {
    return groupOperators.$max(this._fetch(), expr)
  },

  /**
   * Specifies the inclusive lower bound for a specific field
   * @param expr
   * @returns {Number}
   */
  min: function (expr) {
    return groupOperators.$min(this._fetch(), expr)
  },

  /**
   * Applies a function to each document in a cursor and collects the return values in an array.
   * @param callback
   * @returns {Array}
   */
  map: function (callback) {
    return map(this._fetch(), callback)
  },

  /**
   * Applies a JavaScript function for every document in a cursor.
   * @param callback
   */
  forEach: function (callback) {
    each(this._fetch(), callback)
  }
}
