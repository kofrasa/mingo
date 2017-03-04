
/**
 * Group Accumulator Operators. https://docs.mongodb.com/manual/reference/operator/aggregation-group/
 */

var groupOperators = {

  /**
   * Returns an array of all the unique values for the selected field among for each document in that group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */
  $addToSet: function (collection, expr) {
    return unique(this.$push(collection, expr))
  },

  /**
   * Returns the sum of all the values in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */
  $sum: function (collection, expr) {
    if (!isArray(collection)) return 0

    if (isNumber(expr)) {
      // take a short cut if expr is number literal
      return collection.length * expr
    }
    return this.$push(collection, expr).filter(isNumber).reduce(function (acc, n) {
      return acc + n
    }, 0)
  },

  /**
   * Returns the highest value in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */
  $max: function (collection, expr) {
    var mapped = this.$push(collection, expr)
    return mapped.reduce(function (acc, n) {
      if (isNil(acc) || n > acc) return n
      return acc
    }, undefined)
  },

  /**
   * Returns the lowest value in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */
  $min: function (collection, expr) {
    var mapped = this.$push(collection, expr)
    return mapped.reduce(function (acc, n) {
      if (isNil(acc) || n < acc) return n
      return acc
    }, undefined)
  },

  /**
   * Returns an average of all the values in a group.
   *
   * @param collection
   * @param expr
   * @returns {number}
   */
  $avg: function (collection, expr) {
    var dataset = this.$push(collection, expr).filter(isNumber)
    var sum = dataset.reduce(function (acc, n) { return acc + n }, 0)
    return sum / (dataset.length || 1)
  },

  /**
   * Returns an array of all values for the selected field among for each document in that group.
   *
   * @param collection
   * @param expr
   * @returns {Array|*}
   */
  $push: function (collection, expr) {
    if (isNil(expr)) return collection

    return collection.map(function (obj) {
      return computeValue(obj, expr, null)
    })
  },

  /**
   * Returns the first value in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */
  $first: function (collection, expr) {
    return (collection.length > 0) ? computeValue(collection[0], expr) : undefined
  },

  /**
   * Returns the last value in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */
  $last: function (collection, expr) {
    return (collection.length > 0) ? computeValue(collection[collection.length - 1], expr) : undefined
  },

  /**
   * Returns the population standard deviation of the input values.
   * @param  {Array} collection
   * @param  {Object} expr
   * @return {Number}
   */
  $stdDevPop: function (collection, expr) {
    var dataset = this.$push(collection, expr).filter(isNumber)
    return stddev({ dataset: dataset, sampled: false })
  },

  /**
   * Returns the sample standard deviation of the input values.
   * @param  {Array} collection
   * @param  {Object} expr
   * @return {Number|null}
   */
  $stdDevSamp: function (collection, expr) {
    var dataset = this.$push(collection, expr).filter(isNumber)
    return stddev({ dataset: dataset, sampled: true })
  }
}
