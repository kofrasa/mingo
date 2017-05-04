/**
 * Projection Operators. https://docs.mongodb.com/manual/reference/operator/projection/
 */

var projectionOperators = {

  /**
   * Projects the first element in an array that matches the query condition.
   *
   * @param obj
   * @param field
   * @param expr
   */
  $: function (obj, expr, field) {
    err('$ not implemented')
  },

  /**
   * Projects only the first element from an array that matches the specified $elemMatch condition.
   *
   * @param obj
   * @param field
   * @param expr
   * @returns {*}
   */
  $elemMatch: function (obj, expr, field) {
    var array = resolve(obj, field)
    var query = new Mingo.Query(expr)

    if (isNil(array) || !isArray(array)) {
      return undefined
    }

    for (var i = 0; i < array.length; i++) {
      if (query.test(array[i])) {
        return [array[i]]
      }
    }

    return undefined
  },

  /**
   * Limits the number of elements projected from an array. Supports skip and limit slices.
   *
   * @param obj
   * @param field
   * @param expr
   */
  $slice: function (obj, expr, field) {
    var xs = resolve(obj, field)

    if (!isArray(xs)) return xs

    if (isArray(expr)) {
      return slice(xs, expr[0], expr[1])
    } else if (isNumber(expr)) {
      return slice(xs, expr)
    } else {
      err('Invalid argument type for $slice projection operator')
    }
  },

  /**
   * Returns the population standard deviation of the input values.
   * @param  {Array} collection
   * @param  {Object} expr
   * @return {Number}
   */
  $stdDevPop: function (obj, expr, field) {
    var dataset = computeValue(obj, expr, field)
    return stddev({ dataset: dataset, sampled: false })
  },

  /**
   * Returns the sample standard deviation of the input values.
   * @param  {Array} collection
   * @param  {Object} expr
   * @return {Number|null}
   */
  $stdDevSamp: function (obj, expr, field) {
    var dataset = computeValue(obj, expr, field)
    return stddev({ dataset: dataset, sampled: true })
  }
}