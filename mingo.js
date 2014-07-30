(function () {

  "use strict";

  // global on the server, window in the browser
  var root = this;
  var Mingo = {}, previousMingo;
  var _;

  // backup previous Mingo
  if (root != null) {
    previousMingo = root.Mingo;
  }

  Mingo.noConflict = function () {
    root.Mingo = previousMingo;
    return Mingo;
  };

  // Export the Mingo object for **Node.js**
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Mingo;
    } else {
      exports = Mingo;
    }
    _ = require("underscore"); // get a reference to underscore
  } else {
    root.Mingo = Mingo;
    _ = root._; // get a reference to underscore
  }

  // quick reference for
  var primitives = [
    _.isString, _.isBoolean, _.isNumber, _.isDate, _.isNull, _.isRegExp
  ];

  function normalize(expr) {
    // normalized primitives
    for (var i = 0; i < primitives.length; i++) {
      if (primitives[i](expr)) {
        if (_.isRegExp(expr)) {
          return {"$regex": expr};
        } else {
          return {"$eq": expr};
        }
      }
    }
    // normalize object expression
    if (_.isObject(expr)) {
      var operators = _.union(Ops.queryOperators, Ops.customOperators);
      var keys = _.keys(expr);
      var notQuery = _.intersection(operators, keys).length === 0;

      // no valid query operator found, so we do simple comparison
      if (notQuery) {
        return {"$eq": expr};
      }

      // ensure valid regex
      if (_.contains(keys, "$regex")) {
        var regex = expr['$regex'];
        var options = expr['$options'] || "";
        var modifiers = "";
        if (_.isString(regex)) {
          modifiers += (regex.ignoreCase || options.indexOf("i") >= 0) ? "i" : "";
          modifiers += (regex.multiline || options.indexOf("m") >= 0) ? "m" : "";
          modifiers += (regex.global || options.indexOf("g") >= 0) ? "g" : "";
          regex = new RegExp(regex, modifiers);
        }
        expr['$regex'] = regex;
        delete expr['$options'];
      }
    }

    return expr;
  }

  // Settings used by Mingo internally
  var settings = {
    key: "_id"
  };

  /**
   * Setup default settings for Mingo
   * @param options
   */
  Mingo.setup = function (options) {
    _.extend(settings, options || {});
  };


  /**
   * Query object to test collection elements with
   * @param criteria the pass criteria for the query
   * @constructor
   */
  Mingo.Query = function (criteria) {
    this._criteria = criteria || {};
    this._compiledSelectors = [];
    this._compile();
  };

  Mingo.Query.prototype = {

    _compile: function () {

      if (_.isEmpty(this._criteria)) return;

      if (_.isArray(this._criteria) ||
        _.isFunction(this._criteria) || !_.isObject(this._criteria)) {
        throw new Error("Invalid type for criteria");
      }

      for (var name in this._criteria) {
        if (this._criteria.hasOwnProperty(name)) {
          var expr = this._criteria[name];
          if (_.contains(Ops.compoundOperators, name)) {
            if (_.contains(["$not"], name)) {
              throw Error("Invalid operator");
            }
            this._processOperator(name, name, expr);
          } else {
            // normalize expression
            expr = normalize(expr);
            for (var op in expr) {
              if (expr.hasOwnProperty(op)) {
                this._processOperator(name, op, expr[op]);
              }
            }
          }
        }
      }
    },

    _processOperator: function (field, operator, value) {
      var compiledSelector;
      if (_.contains(Ops.simpleOperators, operator)) {
        compiledSelector = {
          test: function (obj) {
            var actualValue = Mingo._resolve(obj, field);
            // value of operator must already be fully resolved.
            return simpleOperators[operator](actualValue, value);
          }
        };
      } else if (_.contains(Ops.compoundOperators, operator)) {
        compiledSelector = compoundOperators[operator](field, value);
      } else if (_.contains(Ops.customOperators, operator)) {
        compiledSelector = customOperators[operator](field, value);
      } else {
        throw Error("Invalid query operator '" + operator + "' detected");
      }
      this._compiledSelectors.push(compiledSelector);
    },

    test: function (model) {
      var match = true;
      for (var i = 0; i < this._compiledSelectors.length; i++) {
        var compiled = this._compiledSelectors[i];
        match = compiled.test(model);
        if (match === false) {
          break;
        }
      }
      return match;
    },

    /**
     *
     * @param collection
     * @param projection
     * @returns {Mingo.Cursor}
     */
    find: function (collection, projection) {
      return new Mingo.Cursor(collection, this, projection);
    },

    /**
     * Remove matched documents from the collection returning the new
     * @param collection
     * @returns {Array}
     */
    remove: function (collection) {
      var arr = [];
      for (var i = 0; i < collection.length; i++) {
        if (this.test(collection[i]) === false) {
          arr.push(collection[i]);
        }
      }
      return arr;
    }

  };

  /**
   * Cursor to iterate and perform filtering on matched objects
   * @param collection
   * @param query
   * @param projection
   * @constructor
   */
  Mingo.Cursor = function (collection, query, projection) {
    this._query = query;
    this._collection = collection;
    this._projection = projection;
    this._operators = {};
    this._result = false;
    this._position = 0;
  };

  Mingo.Cursor.prototype = {

    _fetch: function () {
      var self = this;

      if (this._result === false) {

        // inject projection operator
        if (_.isObject(this._projection)) {
          _.extend(this._operators, {"$project": this._projection});
        }

        if (!_.isArray(this._collection)) {
          throw Error("Input collection is not of a valid type.");
        }

        // filter collection
        this._result = _.filter(this._collection, this._query.test, this._query);
        var pipeline = [];

        _.each(['$sort', '$skip', '$limit', '$project'], function (op) {
          if (_.has(self._operators, op)) {
            pipeline.push(_.pick(self._operators, op));
          }
        });

        if (pipeline.length > 0) {
          var aggregator = new Mingo.Aggregator(pipeline);
          this._result = aggregator.run(this._result, this._query);
        }
      }
      return this._result;
    },

    /**
     * Fetch and return all matched results
     * @returns {Array}
     */
    all: function () {
      return this._fetch();
    },

    /**
     * Fetch and return the first matching result
     * @returns {Object}
     */
    first: function () {
      return this.count() > 0 ? this._fetch()[0] : null;
    },

    /**
     * Fetch and return the last matching object from the result
     * @returns {Object}
     */
    last: function () {
      return this.count() > 0 ? this._fetch()[this.count() - 1] : null;
    },

    /**
     * Counts the number of matched objects found
     * @returns {Number}
     */
    count: function () {
      return this._fetch().length;
    },

    /**
     * Sets the number of results to skip before returning any results.
     * You must apply cursor.skip() to the cursor before retrieving any matching objects.
     * @param {Number} n the number of results to skip.
     * @return {Mingo.Cursor} Returns the cursor, so you can chain this call.
     */
    skip: function (n) {
      _.extend(this._operators, {"$skip": n});
      return this;
    },

    /**
     * Sets the limit of the number of results to return.
     * You must apply limit() to the cursor before retrieving any documents.
     * @param {Number} n the number of results to limit to.
     * @return {Mingo.Cursor} Returns the cursor, so you can chain this call.
     */
    limit: function (n) {
      _.extend(this._operators, {"$limit": n});
      return this;
    },

    /**
     * Sets the sort order of the matching objects
     * @param {Object} modifier an object of key and values specifying the sort order. 1 for ascending and -1 for descending
     * @return {Mingo.Cursor} Returns the cursor, so you can chain this call.
     */
    sort: function (modifier) {
      _.extend(this._operators, {"$sort": modifier});
      return this;
    },

    /**
     * Fetches the next value in the iteration of the cursor
     * @returns {Object | Boolean}
     */
    next: function () {
      if (this.hasNext()) {
        return this._fetch()[this._position++];
      }
      return false;
    },

    /**
     * Checks if the cursor can continue to iterate
     * @returns {boolean}
     */
    hasNext: function () {
      return this.count() > this._position;
    },

    /**
     * Specifies the exclusive upper bound for a specific field
     * @param expr
     * @returns {Number}
     */
    max: function (expr) {
      return groupOperators.$max(this._fetch(), expr);
    },

    /**
     * Specifies the inclusive lower bound for a specific field
     * @param expr
     * @returns {Number}
     */
    min: function (expr) {
      return groupOperators.$min(this._fetch(), expr);
    },

    /**
     * Applies function to each document visited by the cursor and collects the return values from successive application into an array.
     * @param callback
     * @returns {Array}
     */
    map: function (callback) {
      return _.map(this._fetch(), callback);
    },

    /**
     * Iterates the cursor to apply a JavaScript function to each matched document
     * @param callback
     */
    forEach: function (callback) {
      _.each(this._fetch(), callback);
    }

  };

  /**
   * Aggregator for defining filter using mongoDB aggregation pipeline syntax
   * @param operators an Array of pipeline operators
   * @constructor
   */
  Mingo.Aggregator = function (operators) {
    this._operators = operators;
  };

  Mingo.Aggregator.prototype = {

    /**
     * Executes the aggregation pipeline
     * @param collection an array of objects to process
     * @returns {Array}
     */
    run: function (collection, query) {
      if (!_.isEmpty(this._operators)) {
        // run aggregation pipeline
        for (var i = 0; i < this._operators.length; i++) {
          var operator = this._operators[i];
          for (var key in operator) {
            if (operator.hasOwnProperty(key)) {
              if (query) {
                collection = pipelineOperators[key].call(query, collection, operator[key]);
              } else {
                collection = pipelineOperators[key](collection, operator[key]);
              }
            }
          }
        }
      }
      return collection;
    }
  };

  /**
   * Retrieve the value of a given key on an object
   * @param obj
   * @param field
   * @returns {*}
   * @private
   */
  Mingo._get = function (obj, field) {
    return _.result(obj, field);
  };

  /**
   * Resolve the value of the field (dot separated) on the given object
   * @param obj
   * @param field
   * @returns {*}
   */
  Mingo._resolve = function (obj, field) {
    if (!field) {
      return undefined;
    }
    var names = field.split(".");
    var value = obj;
    var isText;

    for (var i = 0; i < names.length; i++) {
      isText = names[i].match(/^\d+$/) === null;

      if (isText && _.isArray(value)) {
        var res = [];
        _.each(value, function (item) {
          if (_.isObject(item)) {
            res.push(Mingo._resolve(item, names[i]));
          }
        });
        value = res;
      } else {
        value = Mingo._get(value, names[i]);
      }

      if (value === undefined) {
        break;
      }
    }

    return value;
  };

  /**
   * Return a new Mingo.Query with the given criteria.
   * @param criteria
   * @returns {Mingo.Query}
   */
  Mingo.compile = function (criteria) {
    return new Mingo.Query(criteria);
  };

  /**
   * Return a cursor for the given query criteria and options
   * @param collection
   * @param criteria
   * @param projection
   * @returns {*}
   */
  Mingo.find = function (collection, criteria, projection) {
    return (new Mingo.Query(criteria)).find(collection, projection);
  };

  /**
   * Returns a new array without objects which match the criteria
   * @param collection
   * @param criteria
   * @returns {Array}
   */
  Mingo.remove = function (collection, criteria) {
    return (new Mingo.Query(criteria)).remove(collection);
  };

  /**
   * Return the result collection after running the aggregation pipeline for the given collection
   * @param collection
   * @param pipeline
   * @returns {Array}
   */
  Mingo.aggregate = function (collection, pipeline) {
    if (!_.isArray(pipeline)) {
      throw Error("Aggregation pipeline must be an array")
    }
    return (new Mingo.Aggregator(pipeline)).run(collection);
  };


  /**
   * Mixin for Backbone.Collection objects
   */
  Mingo.CollectionMixin = {
    /**
     * Runs a query and returns a cursor to the result
     * @param criteria
     * @param projection
     * @returns {Mingo.Cursor}
     */
    query: function (criteria, projection) {
      return Mingo.find(this.toJSON(), criteria, projection);
    },

    /**
     * Runs the given aggregation operators on this collection
     * @params pipeline
     * @returns {Array}
     */
    aggregate: function (pipeline) {
      var args = [this.toJSON(), pipeline];
      return Mingo.aggregate.apply(null, args);
    }
  };

  // store custom operator functions
  var customOperators = {};

  /**
   * Adds a new custom operator.
   * Function must accept two arguments (selector, value) and must
   * return an object with one function 'test' which accepts an object from the collection and return a boolean
   * @param operator
   * @param fn
   */
  Mingo.addOperator = function (operator, fn) {
    if (operator && operator[0] !== "$") {
      throw new Error("Invalid name, custom operator must start with '$'");
    }
    if (_.contains(Ops.queryOperators, operator)) {
      throw new Error("Invalid name, cannot override default operator '" + operator + "'");
    }

    customOperators[operator] = fn;
    Ops.customOperators.push(operator);
    Ops.customOperators = _.uniq(Ops.customOperators);
  };

  var pipelineOperators = {

    /**
     * Groups documents together for the purpose of calculating aggregate values based on a collection of documents.
     *
     * @param collection
     * @param expr
     * @returns {Array}
     */
    $group: function (collection, expr) {
      // lookup key for grouping
      var idKey = expr[settings.key];
      var indexes = [];
      // group collection by key
      var groups = _.groupBy(collection, function (obj) {
        var key = computeValue(obj, idKey, idKey);
        indexes.push(key);
        return key;
      });

      // group indexes
      indexes = _.uniq(indexes);

      // remove the group key
      expr = _.omit(expr, settings.key);

      var result = [];
      _.each(indexes, function (index) {
        var obj = {};
        obj[settings.key] = index;
        // compute remaining keys in expression
        for (var key in expr) {
          if (expr.hasOwnProperty(key)) {
            obj[key] = accumulate(groups[index], key, expr[key]);
          }
        }
        result.push(obj);
      });

      return result;
    },

    /**
     * Filters the document stream, and only allows matching documents to pass into the next pipeline stage.
     * $match uses standard MongoDB queries.
     *
     * @param collection
     * @param expr
     * @returns {Array|*}
     */
    $match: function (collection, expr) {
      var query = new Mingo.Query(expr);
      return query.find(collection).all();
    },

    /**
     * Reshapes a document stream.
     * $project can rename, add, or remove fields as well as create computed values and sub-documents.
     *
     * @param collection
     * @param expr
     * @returns {Array}
     */
    $project: function (collection, expr) {

      // result collection
      var projected = [];
      var objKeys = _.keys(expr);
      var removeId = false;

      if (_.contains(objKeys, settings.key)) {
        var id = objKeys[settings.key];
        removeId = (id === 0 || id === false);
      }

      for (var i = 0; i < collection.length; i++) {
        var obj = collection[i];
        var cloneObj = {};

        _.each(objKeys, function (key) {

          // tiny optimization here to skip over id
          if (removeId && key === settings.key) return;

          var subExpr = expr[key];

          if (_.isString(subExpr)) {
            cloneObj[key] = computeValue(obj, subExpr, key);
          } else if (subExpr === 1 || subExpr === true) {
            cloneObj[key] = _.result(obj, key);
          } else if (_.isObject(subExpr)) {
            var operator = _.keys(subExpr);
            operator = operator.length > 1 ? false : operator[0];
            if (operator !== false && _.contains(Ops.projectionOperators, operator)) {
              // apply the projection operator on the operator expression for the key
              var temp = projectionOperators[operator](obj, subExpr[operator], key);
              if (!_.isUndefined(temp)) {
                cloneObj[key] = temp;
              }
            } else {
              // compute the value for the sub expression for the key
              cloneObj[key] = computeValue(obj, subExpr, key);
            }
          }
        });

        if (!removeId && !_.has(cloneObj, settings.key)) {
          cloneObj[settings.key] = obj[settings.key];
        }

        projected.push(cloneObj);
      }

      return projected;
    },

    /**
     * Restricts the number of documents in an aggregation pipeline.
     *
     * @param collection
     * @param value
     * @returns {Object|*}
     */
    $limit: function (collection, value) {
      return _.first(collection, value);
    },

    /**
     * Skips over a specified number of documents from the pipeline and returns the rest.
     *
     * @param collection
     * @param value
     * @returns {*}
     */
    $skip: function (collection, value) {
      return _.rest(collection, value);
    },

    /**
     * Takes an array of documents and returns them as a stream of documents.
     *
     * @param collection
     * @param expr
     * @returns {Array}
     */
    $unwind: function (collection, expr) {
      var result = [];
      var field = expr.substr(1);
      for (var i = 0; i < collection.length; i++) {
        var obj = collection[i];
        // must throw an error if value is not an array
        var value = Mingo._get(obj, field);
        if (_.isArray(value)) {
          _.each(value, function (item) {
            var tmp = _.clone(obj);
            tmp[field] = item;
            result.push(tmp);
          });
        } else {
          throw new Error("Target field '" + field + "' is not of type Array.");
        }
      }
      return result;
    },

    /**
     * Takes all input documents and returns them in a stream of sorted documents.
     *
     * @param collection
     * @param sortKeys
     * @returns {*}
     */
    $sort: function (collection, sortKeys) {
      if (!_.isEmpty(sortKeys) && _.isObject(sortKeys)) {
        var modifiers = _.keys(sortKeys);
        modifiers.reverse().forEach(function (key) {
          var indexes = [];
          var grouped = _.groupBy(collection, function (obj) {
            var value = Mingo._resolve(obj, key);
            indexes.push(value);
            return value;
          });
          indexes = _.sortBy(_.uniq(indexes), function (item) {
            return item;
          });
          if (sortKeys[key] === -1) {
            indexes.reverse();
          }
          collection = [];
          _.each(indexes, function (item) {
            Array.prototype.push.apply(collection, grouped[item]);
          });
        });
      }
      return collection;
    }
  };

  var compoundOperators = {

    /**
     * Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
     *
     * @param selector
     * @param value
     * @returns {{test: Function}}
     */
    $and: function (selector, value) {
      if (!_.isArray(value)) {
        throw new Error("Invalid expression for $and criteria");
      }
      var queries = [];
      _.each(value, function (expr) {
        queries.push(new Mingo.Query(expr));
      });

      return {
        test: function (obj) {
          for (var i = 0; i < queries.length; i++) {
            if (queries[i].test(obj) === false) {
              return false;
            }
          }
          return true;
        }
      };
    },

    /**
     * Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
     *
     * @param selector
     * @param value
     * @returns {{test: Function}}
     */
    $or: function (selector, value) {
      if (!_.isArray(value)) {
        throw new Error("Invalid expression for $or criteria");
      }
      var queries = [];
      _.each(value, function (expr) {
        queries.push(new Mingo.Query(expr));
      });

      return {
        test: function (obj) {
          for (var i = 0; i < queries.length; i++) {
            if (queries[i].test(obj) === true) {
              return true;
            }
          }
          return false;
        }
      };
    },

    /**
     * Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
     *
     * @param selector
     * @param value
     * @returns {{test: Function}}
     */
    $nor: function (selector, value) {
      if (!_.isArray(value)) {
        throw new Error("Invalid expression for $nor criteria");
      }
      var query = this.$or("$or", value);
      return {
        test: function (obj) {
          return !query.test(obj);
        }
      };
    },

    /**
     * Inverts the effect of a query expression and returns documents that do not match the query expression.
     *
     * @param selector
     * @param value
     * @returns {{test: Function}}
     */
    $not: function (selector, value) {
      var criteria = {};
      criteria[selector] = normalize(value);
      var query = new Mingo.Query(criteria);
      return {
        test: function (obj) {
          return !query.test(obj);
        }
      };
    },

    /**
     * Matches documents that satisfy a JavaScript expression.
     *
     * @param selector
     * @param value
     * @returns {{test: test}}
     */
    $where: function (selector, value) {
      if (!_.isFunction(value)) {
        value = new Function("return " + value + ";");
      }
      return {
        test: function (obj) {
          return value.call(obj) === true;
        }
      };
    }

  };

  var simpleOperators = {

    /**
     * Checks that two values are equal. Pseudo operator introduced for convenience and consistency
     *
     * @param a
     * @param b
     * @returns {*}
     */
    $eq: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return _.isEqual(val, b);
      });
      return a !== undefined;
    },

    /**
     * Matches all values that are not equal to the value specified in the query.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $ne: function (a, b) {
      return !this.$eq(a, b);
    },

    /**
     * Matches any of the values that exist in an array specified in the query.
     *
     * @param a
     * @param b
     * @returns {*}
     */
    $in: function (a, b) {
      a = _.isArray(a) ? a : [a];
      return _.intersection(a, b).length > 0;
    },

    /**
     * Matches values that do not exist in an array specified to the query.
     *
     * @param a
     * @param b
     * @returns {*|boolean}
     */
    $nin: function (a, b) {
      return _.isUndefined(a) || !this.$in(a, b);
    },

    /**
     * Matches values that are less than the value specified in the query.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $lt: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return val < b
      });
      return a !== undefined;
    },

    /**
     * Matches values that are less than or equal to the value specified in the query.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $lte: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return val <= b
      });
      return a !== undefined;
    },

    /**
     * Matches values that are greater than the value specified in the query.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $gt: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return val > b
      });
      return a !== undefined;
    },

    /**
     * Matches values that are greater than or equal to the value specified in the query.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $gte: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return val >= b
      });
      return a !== undefined;
    },

    /**
     * Performs a modulo operation on the value of a field and selects documents with a specified result.
     *
     * @param a
     * @param b
     * @returns {*|boolean|boolean}
     */
    $mod: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return _.isNumber(val) && _.isArray(b) && b.length === 2 && (val % b[0]) === b[1];
      });
      return a !== undefined;
    },

    /**
     * Selects documents where values match a specified regular expression.
     *
     * @param a
     * @param b
     * @returns {*|boolean}
     */
    $regex: function (a, b) {
      a = _.isArray(a) ? a : [a];
      a = _.find(a, function (val) {
        return _.isString(val) && _.isRegExp(b) && (!!val.match(b));
      });
      return a !== undefined;
    },

    /**
     * Matches documents that have the specified field.
     *
     * @param a
     * @param b
     * @returns {boolean|*|boolean}
     */
    $exists: function (a, b) {
      return (b === false && _.isUndefined(a)) || (b === true && !_.isUndefined(a));
    },

    /**
     * Matches arrays that contain all elements specified in the query.
     *
     * @param a
     * @param b
     * @returns boolean
     */
    $all: function (a, b) {
      var self = this;
      var matched = false;
      if (_.isArray(a) && _.isArray(b)) {
        for (var i = 0; i < b.length; i++) {
          if (_.isObject(b[i]) && _.contains(_.keys(b[i]), "$elemMatch")) {
            matched = matched || self.$elemMatch(a, b[i].$elemMatch);
          } else {
            // order of arguments matter. underscore maintains order after intersection
            return _.intersection(b, a).length === b.length;
          }
        }
      }
      return matched;
    },

    /**
     * Selects documents if the array field is a specified size.
     *
     * @param a
     * @param b
     * @returns {*|boolean}
     */
    $size: function (a, b) {
      return _.isArray(a) && _.isNumber(b) && (a.length === b);
    },

    /**
     * Selects documents if element in the array field matches all the specified $elemMatch condition.
     *
     * @param a
     * @param b
     */
    $elemMatch: function (a, b) {
      if (_.isArray(a) && !_.isEmpty(a)) {
        var query = new Mingo.Query(b);
        for (var i = 0; i < a.length; i++) {
          if (query.test(a[i])) {
            return true;
          }
        }
      }
      return false;
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
          return _.isNumeric(a) && (a + "").indexOf(".") !== -1;
        case 2:
        case 5:
          return _.isString(a);
        case 3:
          return _.isObject(a);
        case 4:
          return _.isArray(a);
        case 8:
          return _.isBoolean(a);
        case 9:
          return _.isDate(a);
        case 10:
          return _.isNull(a);
        case 11:
          return _.isRegExp(a);
        case 16:
          return _.isNumeric(a) && a <= 2147483647 && (a + "").indexOf(".") === -1;
        case 18:
          return _.isNumeric(a) && a > 2147483647 && a <= 9223372036854775807 && (a + "").indexOf(".") === -1;
        default:
          return false;
      }
    }

  };

  var projectionOperators = {

    /**
     * Projects the first element in an array that matches the query condition.
     *
     * @param obj
     * @param field
     * @param expr
     */
    $: function (obj, expr, field) {
      throw new Error("$ not implemented");
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
      var array = Mingo._resolve(obj, field);
      var query = new Mingo.Query(expr);

      if (_.isUndefined(array) || !_.isArray(array)) {
        return undefined;
      }

      for (var i = 0; i < array.length; i++) {
        if (query.test(array[i])) {
          return array[i];
        }
      }

      return undefined;
    },

    /**
     * Limits the number of elements projected from an array. Supports skip and limit slices.
     *
     * @param obj
     * @param field
     * @param expr
     */
    $slice: function (obj, expr, field) {
      var array = Mingo._resolve(obj, field);

      if (_.isUndefined(array)) {
        return undefined;
      }
      if (!_.isArray(expr)) {
        expr = [expr];
      }
      return Array.prototype.slice.apply(array, expr);
    }
  };

  var groupOperators = {

    /**
     * Returns an array of all the unique values for the selected field among for each document in that group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $addToSet: function (collection, expr) {
      var result = _.map(collection, function (obj) {
        return computeValue(obj, expr);
      });
      return _.uniq(result);
    },

    /**
     * Returns the sum of all the values in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $sum: function (collection, expr) {
      if (_.isNumber(expr)) {
        // take a short cut if expr is number literal
        return collection.length * expr;
      }
      return _.reduce(collection, function (acc, obj) {
        // pass empty field to avoid naming conflicts with fields on documents
        return acc + computeValue(obj, expr);
      }, 0);
    },

    /**
     * Returns the highest value in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $max: function (collection, expr) {
      var obj = _.max(collection, function (obj) {
        return computeValue(obj, expr);
      });
      return computeValue(obj, expr);
    },

    /**
     * Returns the lowest value in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $min: function (collection, expr) {
      var obj = _.min(collection, function (obj) {
        return computeValue(obj, expr);
      });
      return computeValue(obj, expr);
    },

    /**
     * Returns an average of all the values in a group.
     *
     * @param collection
     * @param expr
     * @returns {number}
     */
    $avg: function (collection, expr) {
      return this.$sum(collection, expr) / collection.length;
    },

    /**
     * Returns an array of all values for the selected field among for each document in that group.
     *
     * @param collection
     * @param expr
     * @returns {Array|*}
     */
    $push: function (collection, expr) {
      return _.map(collection, function (obj) {
        return computeValue(obj, expr);
      });
    },

    /**
     * Returns the first value in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $first: function (collection, expr) {
      return (collection.length > 0) ? computeValue(collection[0], expr) : undefined;
    },

    /**
     * Returns the last value in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $last: function (collection, expr) {
      return (collection.length > 0) ? computeValue(collection[collection.length - 1], expr) : undefined;
    }
  };

  var aggregateOperators = {

    /**
     * Computes the sum of an array of numbers.
     *
     * @param obj
     * @param expr
     * @returns {Object}
     */
    $add: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.reduce(args, function (memo, num) {
        return memo + num;
      }, 0);
    },

    /**
     * Takes an array that contains two numbers or two dates and subtracts the second value from the first.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $subtract: function (obj, expr) {
      var args = computeValue(obj, expr);
      return args[0] - args[1];
    },

    /**
     * Takes two numbers and divides the first number by the second.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $divide: function (obj, expr) {
      var args = computeValue(obj, expr);
      return args[0] / args[1];
    },

    /**
     * Computes the product of an array of numbers.
     *
     * @param obj
     * @param expr
     * @returns {Object}
     */
    $multiply: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.reduce(args, function (memo, num) {
        return memo * num;
      }, 1);
    },

    /**
     * Takes two numbers and calculates the modulo of the first number divided by the second.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $mod: function (obj, expr) {
      var args = computeValue(obj, expr);
      return args[0] % args[1];
    },

    /**
     * Compares two values and returns the result of the comparison as an integer.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $cmp: function (obj, expr) {
      var args = computeValue(obj, expr);
      if (args[0] > args[1]) {
        return 1;
      }
      return (args[0] < args[1]) ? -1 : 0;
    },

    /**
     * Concatenates two strings.
     *
     * @param obj
     * @param expr
     * @returns {string|*}
     */
    $concat: function (obj, expr) {
      var args = computeValue(obj, expr);
      return args.join("");
    },

    /**
     * Compares two strings and returns an integer that reflects the comparison.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $strcasecmp: function (obj, expr) {
      var args = computeValue(obj, expr);
      args[0] = args[0].toUpperCase();
      args[1] = args[1].toUpperCase();
      if (args[0] > args[1]) {
        return 1;
      }
      return (args[0] < args[1]) ? -1 : 0;
    },

    /**
     * Takes a string and returns portion of that string.
     *
     * @param obj
     * @param expr
     * @returns {string}
     */
    $substr: function (obj, expr) {
      var args = computeValue(obj, expr);
      if (_.isString(args[0])) {
        return args[0].substr(args[1], args[2]);
      }
      return undefined;
    },

    /**
     * Converts a string to lowercase.
     *
     * @param obj
     * @param expr
     * @returns {string}
     */
    $toLower: function (obj, expr) {
      var value = computeValue(obj, expr);
      return value.toLowerCase();
    },

    /**
     * Converts a string to uppercase.
     *
     * @param obj
     * @param expr
     * @returns {string}
     */
    $toUpper: function (obj, expr) {
      var value = computeValue(obj, expr);
      return value.toUpperCase();
    }
  };

  // These operators provide operations on sets.
  var setOperators = {
    /**
     * Returns true if two sets have the same elements.
     * @param obj
     * @param expr
     */
    $setEquals: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.difference(args[0], args[1]).length === 0;
    },

    /**
     * Returns the common elements of the input sets.
     * @param obj
     * @param expr
     */
    $setIntersection: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.intersection(args[0], args[1]);
    },

    /**
     * Returns elements of a set that do not appear in a second set.
     * @param obj
     * @param expr
     */
    $setDifference: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.difference(args[0], args[1]);
    },

    /**
     * Returns a set that holds all elements of the input sets.
     * @param obj
     * @param expr
     */
    $setUnion: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.union(args[0], args[1]);
    },

    /**
     * Returns true if all elements of a set appear in a second set.
     * @param obj
     * @param expr
     */
    $setIsSubset: function (obj, expr) {
      var args = computeValue(obj, expr);
      return _.intersection(args[0], args[1]).length === args[0].length;
    },

    /**
     * Returns true if any elements of a set evaluate to true, and false otherwise.
     * @param obj
     * @param expr
     */
    $anyElementTrue: function (obj, expr) {
      var args = computeValue(obj, expr);
      for (var i = 0; i < args.length; i++) {
        if (!!args[i])
          return true;
      }
      return false;
    },

    /**
     * Returns true if all elements of a set evaluate to true, and false otherwise.
     * @param obj
     * @param expr
     */
    $allElementsTrue: function (obj, expr) {
      var args = computeValue(obj, expr);
      for (var i = 0; i < args.length; i++) {
        if (!args[i])
          return false;
      }
      return true;
    }
  };

  var conditionalOperators = {

    /**
     * A ternary operator that evaluates one expression,
     * and depending on the result returns the value of one following expressions.
     *
     * @param obj
     * @param expr
     */
    $cond: function (obj, expr) {
      var ifExpr, thenExpr, elseExpr;
      if (_.isArray(expr)) {
        if (expr.length != 3) {
          throw Error("Invalid arguments for $cond operator");
        }
        ifExpr = expr[0];
        thenExpr = expr[1];
        elseExpr = expr[2];
      } else if (_.isObject(expr)) {
        ifExpr = expr['if'];
        thenExpr = expr['then'];
        elseExpr = expr['else'];
      }
      var condition = computeValue(obj, ifExpr);
      return condition ? computeValue(obj, thenExpr) : computeValue(obj, elseExpr);
    },

    /**
     * Evaluates an expression and returns the first expression if it evaluates to a non-null value.
     * Otherwise, $ifNull returns the second expression's value.
     *
     * @param obj
     * @param expr
     * @returns {*}
     */
    $ifNull: function (obj, expr) {
      if (!_.isArray(expr) || expr.length != 2) {
        throw Error("Invalid arguments for $ifNull operator");
      }
      var args = computeValue(obj, expr);
      return (args[0] === null || args[0] === undefined) ? args[1] : args[0];
    }
  };

  // mixin simple operators into aggregate operators
  _.each(["$eq", "$ne", "$gt", "$gte", "$lt", "$lte"], function (op) {
    aggregateOperators[op] = function (obj, expr) {
      var args = computeValue(obj, expr);
      return simpleOperators[op](args[0], args[1]);
    };
  });

  // mixin extra operators into aggregate operators
  _.extend(aggregateOperators, setOperators, conditionalOperators);

  var Ops = {
    simpleOperators: _.keys(simpleOperators),
    compoundOperators: _.keys(compoundOperators),
    setOperators: _.keys(setOperators),
    aggregateOperators: _.keys(aggregateOperators),
    groupOperators: _.keys(groupOperators),
    pipelineOperators: _.keys(pipelineOperators),
    projectionOperators: _.keys(projectionOperators),
    customOperators: []
  };
  Ops.queryOperators = _.union(Ops.simpleOperators, Ops.compoundOperators);

  /**
   * Returns the result of evaluating a $group operation over a collection
   *
   * @param collection
   * @param field the name of the aggregate operator or field
   * @param expr the expression of the aggregate operator for the field
   * @returns {*}
   */
  var accumulate = function (collection, field, expr) {
    if (_.contains(Ops.groupOperators, field)) {
      return groupOperators[field](collection, expr);
    }

    if (_.isObject(expr)) {
      var result = {};
      for (var key in expr) {
        if (expr.hasOwnProperty(key)) {
          result[key] = accumulate(collection, key, expr[key]);
          // must run ONLY one group operator per expression
          // if so, return result of the computed value
          if (_.contains(Ops.groupOperators, key)) {
            result = result[key];
            // if there are more keys in expression this is bad
            if (_.keys(expr).length > 1) {
              throw new Error("Invalid $group expression '" + JSON.stringify(expr) + "'");
            }
            break;
          }
        }
      }
      return result;
    }

    return undefined;
  };

  /**
   * Computes the actual value of the expression using the given object as context
   *
   * @param obj the current object from the collection
   * @param expr the expression for the given field
   * @param field the field name (may also be an aggregate operator)
   * @returns {*}
   */
  var computeValue = function (obj, expr, field) {

    // if the field of the object is a valid operator
    if (_.contains(Ops.aggregateOperators, field)) {
      return aggregateOperators[field](obj, expr);
    }

    // if expr is a variable for an object field
    // field not used in this case
    if (_.isString(expr) && expr.length > 0 && expr[0] === "$") {
      return Mingo._resolve(obj, expr.slice(1));
    }

    var result;

    if (_.isArray(expr)) {
      result = [];
      for (var i = 0; i < expr.length; i++) {
        result.push(computeValue(obj, expr[i], null));
      }
    } else if (_.isObject(expr)) {
      result = {};
      for (var key in expr) {
        if (expr.hasOwnProperty(key)) {
          result[key] = computeValue(obj, expr[key], key);

          // must run ONLY one aggregate operator per expression
          // if so, return result of the computed value
          if (_.contains(Ops.aggregateOperators, key)) {
            result = result[key];
            // if there are more keys in expression this is bad
            if (_.keys(expr).length > 1) {
              throw new Error("Invalid aggregation expression '" + JSON.stringify(expr) + "'");
            }
            break;
          }
        }
      }
    } else {
      // check and return value if already in a resolved state
      for (var i = 0; i < primitives.length; i++) {
        if (primitives[i](expr)) {
          return expr;
        }
      }
    }

    return result;
  };

}).call(this);