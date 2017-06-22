/**
 * Query object to test collection elements with
 * @param criteria the pass criteria for the query
 * @param projection optional projection specifiers
 * @constructor
 */
Mingo.Query = function (criteria, projection) {
  if (!(this instanceof Mingo.Query)) return new Mingo.Query(criteria, projection)

  this.__criteria = criteria
  this.__projection = projection
  this.__compiled = []
  this._compile()
}

Mingo.Query.prototype = {

  _compile: function () {
    if (isEmpty(this.__criteria)) return

    assert(isObject(this.__criteria), 'Criteria must be of type Object')

    var whereOperator;

    for (var field in this.__criteria) {
      if (has(this.__criteria, field)) {
        var expr = this.__criteria[field]
        // save $where operators to be executed after other operators
        if ('$where' === field) {
          whereOperator = {field: field, expr: expr};
        } else if (inArray(['$and', '$or', '$nor'], field)) {
          this._processOperator(field, field, expr)
        } else {
          // normalize expression
          expr = normalize(expr)
          for (var op in expr) {
            if (has(expr, op)) {
              this._processOperator(field, op, expr[op])
            }
          }
        }
      }

      if (isObject(whereOperator)) {
        this._processOperator(whereOperator.field, whereOperator.field, whereOperator.expr);
      }

    }
  },

  _processOperator: function (field, operator, value) {
    if (inArray(ops(KEY_QUERY), operator)) {
      this.__compiled.push(queryOperators[operator](field, value))
    } else {
      err("Invalid query operator '" + operator + "' detected")
    }
  },

  /**
   * Checks if the object passes the query criteria. Returns true if so, false otherwise.
   * @param obj
   * @returns {boolean}
   */
  test: function (obj) {
    for (var i = 0; i < this.__compiled.length; i++) {
      if (!this.__compiled[i].test(obj)) {
        return false
      }
    }
    return true
  },

  /**
   * Performs a query on a collection and returns a cursor object.
   * @param collection
   * @param projection
   * @returns {Mingo.Cursor}
   */
  find: function (collection, projection) {
    return new Mingo.Cursor(collection, this, projection)
  },

  /**
   * Remove matched documents from the collection returning the remainder
   * @param collection
   * @returns {Array}
   */
  remove: function (collection) {
    var self = this
    return collection.reduce(function (acc, obj) {
      if (!self.test(obj)) {
        acc.push(obj)
      }
      return acc
    }, [])
  }
}

