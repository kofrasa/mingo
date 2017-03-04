
/**
 * Performs a query on a collection and returns a cursor object.
 *
 * @param collection
 * @param criteria
 * @param projection
 * @returns {Mingo.Cursor}
 */
Mingo.find = function (collection, criteria, projection) {
  return (new Mingo.Query(criteria)).find(collection, projection)
}

/**
 * Returns a new array without objects which match the criteria
 *
 * @param collection
 * @param criteria
 * @returns {Array}
 */
Mingo.remove = function (collection, criteria) {
  return (new Mingo.Query(criteria)).remove(collection)
}

/**
 * Return the result collection after running the aggregation pipeline for the given collection
 *
 * @param collection
 * @param pipeline
 * @returns {Array}
 */
Mingo.aggregate = function (collection, pipeline) {
  if (!isArray(pipeline)) {
    err('Aggregation pipeline must be an array')
  }
  return (new Mingo.Aggregator(pipeline)).run(collection)
}

/**
 * Mixin for Collection types that provide a method `toJSON() -> Array[Object]`
 */
Mingo.CollectionMixin = {

  /**
   * Runs a query and returns a cursor to the result
   * @param criteria
   * @param projection
   * @returns {Mingo.Cursor}
   */
  query: function (criteria, projection) {
    return Mingo.find(this.toJSON(), criteria, projection)
  },

  /**
   * Runs the given aggregation operators on this collection
   * @params pipeline
   * @returns {Array}
   */
  aggregate: function (pipeline) {
    return Mingo.aggregate.call(null, this.toJSON(), pipeline)
  }
}
