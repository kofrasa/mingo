
/**
 * Query and Projection Operators. https://docs.mongodb.com/manual/reference/operator/query/
 */

var simpleOperators = {

  /**
   * Checks that two values are equal. Pseudo operator introduced for convenience and consistency
   *
   * @param a         The lhs operand as resolved from the object by the given selector
   * @param b         The rhs operand provided by the user
   * @returns {*}
   */
  $eq: function (a, b) {
    return isEqual(a, b) || (isArray(a) && a.findIndex(isEqual.bind(null, b)) !== -1)
  },

  /**
   * Matches all values that are not equal to the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $ne: function (a, b) {
    return !this.$eq(a, b)
  },

  /**
   * Matches any of the values that exist in an array specified in the query.
   *
   * @param a
   * @param b
   * @returns {*}
   */
  $in: function (a, b) {
    a = array(a)
    return intersection(a, b).length > 0
  },

  /**
   * Matches values that do not exist in an array specified to the query.
   *
   * @param a
   * @param b
   * @returns {*|boolean}
   */
  $nin: function (a, b) {
    return isUndefined(a) || !this.$in(a, b)
  },

  /**
   * Matches values that are less than the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $lt: function (a, b) {
    a = array(a).find(function (val) {
      return val < b
    })
    return a !== undefined
  },

  /**
   * Matches values that are less than or equal to the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $lte: function (a, b) {
    a = array(a).find(function (val) {
      return val <= b
    })
    return a !== undefined
  },

  /**
   * Matches values that are greater than the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $gt: function (a, b) {
    a = array(a).find(function (val) {
      return val > b
    })
    return a !== undefined
  },

  /**
   * Matches values that are greater than or equal to the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $gte: function (a, b) {
    a = array(a).find(function (val) {
      return val >= b
    })
    return a !== undefined
  },

  /**
   * Performs a modulo operation on the value of a field and selects documents with a specified result.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $mod: function (a, b) {
    a = array(a).find(function (val) {
      return isNumber(val) && isArray(b) && b.length === 2 && (val % b[0]) === b[1]
    })
    return a !== undefined
  },

  /**
   * Selects documents where values match a specified regular expression.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $regex: function (a, b) {
    a = array(a).find(function (val) {
      return isString(val) && isRegExp(b) && (!!val.match(b))
    })
    return a !== undefined
  },

  /**
   * Matches documents that have the specified field.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $exists: function (a, b) {
    return (b === false && isUndefined(a)) || (b === true && !isUndefined(a))
  },

  /**
   * Matches arrays that contain all elements specified in the query.
   *
   * @param a
   * @param b
   * @returns boolean
   */
  $all: function (a, b) {
    var self = this
    var matched = false
    if (isArray(a) && isArray(b)) {
      for (var i = 0; i < b.length; i++) {
        if (isObject(b[i]) && inArray(keys(b[i]), '$elemMatch')) {
          matched = matched || self.$elemMatch(a, b[i].$elemMatch)
        } else {
          // order of arguments matter
          return intersection(b, a).length === b.length
        }
      }
    }
    return matched
  },

  /**
   * Selects documents if the array field is a specified size.
   *
   * @param a
   * @param b
   * @returns {*|boolean}
   */
  $size: function (a, b) {
    return isArray(a) && isNumber(b) && (a.length === b)
  },

  /**
   * Selects documents if element in the array field matches all the specified $elemMatch condition.
   *
   * @param a
   * @param b
   */
  $elemMatch: function (a, b) {
    if (isArray(a) && !isEmpty(a)) {
      var query = new Mingo.Query(b)
      for (var i = 0; i < a.length; i++) {
        if (query.test(a[i])) {
          return true
        }
      }
    }
    return false
  },

  /**
   * Selects documents if a field is of the specified type.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */
  $type: function (a, b) {
    switch (b) {
      case 1:
      case "double":
        return isNumber(a) && (a + '').indexOf('.') !== -1
      case 2:
      case "string":
      case 5:
      case "bindata":
        return isString(a)
      case 3:
      case "object":
        return isObject(a)
      case 4:
      case "array":
        return isArray(a)
      case 6:
      case "undefined":
        return isUndefined(a)
      case 8:
      case "bool":
        return isBoolean(a)
      case 9:
      case "date":
        return isDate(a)
      case 10:
      case "null":
        return isNull(a)
      case 11:
      case "regex":
        return isRegExp(a)
      case 16:
      case "int":
        return isNumber(a) && a <= 2147483647 && (a + '').indexOf('.') === -1
      case 18:
      case "long":
        return isNumber(a) && a > 2147483647 && a <= 9223372036854775807 && (a + '').indexOf('.') === -1
      case 19:
      case "decimal":
        return isNumber(a)
      default:
        return false
    }
  }
}

var queryOperators = {

  /**
   * Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
   *
   * @param selector
   * @param value
   * @returns {{test: Function}}
   */
  $and: function (selector, value) {
    assert(isArray(value), 'Invalid expression: $and expects value to be an Array')
    var queries = []
    each(value, function (expr) {
      queries.push(new Mingo.Query(expr))
    })

    return {
      test: function (obj) {
        for (var i = 0; i < queries.length; i++) {
          if (!queries[i].test(obj)) {
            return false
          }
        }
        return true
      }
    }
  },

  /**
   * Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
   *
   * @param selector
   * @param value
   * @returns {{test: Function}}
   */
  $or: function (selector, value) {
    if (!isArray(value)) {
      err('Invalid expression for $or criteria')
    }
    var queries = []
    each(value, function (expr) {
      queries.push(new Mingo.Query(expr))
    })

    return {
      test: function (obj) {
        for (var i = 0; i < queries.length; i++) {
          if (queries[i].test(obj)) {
            return true
          }
        }
        return false
      }
    }
  },

  /**
   * Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
   *
   * @param selector
   * @param value
   * @returns {{test: Function}}
   */
  $nor: function (selector, value) {
    if (!isArray(value)) {
      err('Invalid expression for $nor criteria')
    }
    var query = this.$or('$or', value)
    return {
      test: function (obj) {
        return !query.test(obj)
      }
    }
  },

  /**
   * Inverts the effect of a query expression and returns documents that do not match the query expression.
   *
   * @param selector
   * @param value
   * @returns {{test: Function}}
   */
  $not: function (selector, value) {
    var criteria = {}
    criteria[selector] = normalize(value)
    var query = new Mingo.Query(criteria)
    return {
      test: function (obj) {
        return !query.test(obj)
      }
    }
  },

  /**
   * Matches documents that satisfy a JavaScript expression.
   *
   * @param selector
   * @param value
   * @returns {{test: test}}
   */
  $where: function (selector, value) {
    if (!isFunction(value)) {
      value = new Function('return ' + value + ';')
    }
    return {
      test: function (obj) {
        return value.call(obj) === true
      }
    }
  }
}

// add simple query operators
each(simpleOperators, function (fn, op) {
  queryOperators[op] = (function (f, ctx) {
    return function (selector, value) {
      return {
        test: function (obj) {
          // value of field must be fully resolved.
          var lhs = resolve(obj, selector)
          return f.call(ctx, lhs, value)
        }
      }
    }
  }(fn, simpleOperators))
})