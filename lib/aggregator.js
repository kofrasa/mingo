
/**
 * Aggregator for defining filter using mongoDB aggregation pipeline syntax
 *
 * @param operators an Array of pipeline operators
 * @constructor
 */
Mingo.Aggregator = function (operators) {
  if (!(this instanceof Mingo.Aggregator)) return new Mingo.Aggregator(operators)

  this.__operators = operators
}

/**
 * Apply the pipeline operations over the collection by order of the sequence added
 *
 * @param collection an array of objects to process
 * @param query the `Query` object to use as context
 * @returns {Array}
 */
Mingo.Aggregator.prototype.run = function (collection, query) {
  if (!isEmpty(this.__operators)) {
    // run aggregation pipeline
    for (var i = 0; i < this.__operators.length; i++) {
      var operator = this.__operators[i]
      var key = keys(operator)
      if (key.length === 1 && inArray(ops(OP_PIPELINE), key[0])) {
        key = key[0]
        if (query instanceof Mingo.Query) {
          collection = pipelineOperators[key].call(query, collection, operator[key])
        } else {
          collection = pipelineOperators[key](collection, operator[key])
        }
      } else {
        err("Invalid aggregation operator '" + key + "'")
      }
    }
  }
  return collection
}
