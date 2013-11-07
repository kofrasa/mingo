
(function () {

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

  var normalize = function(value) {
    for (var i = 0; i < primitives.length; i++) {
      if (primitives[i](value)) {
        if (_.isRegExp(value)) {
          return {"$regex": value};
        } else {
          return {"$eq": value};
        }
      }
    }
    if (_.isObject(value)) {
      var operators = _.union(Ops.queryOperators, Ops.customOperators);
      var notQuery = _.intersection(operators, _.keys(value)).length === 0;
      if (notQuery) {
        return {"$eq": value};
      }
    }
    return value;
  };

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
        _.isFunction(this._criteria) ||
        !_.isObject(this._criteria)) {
        throw new Error("Invalid type for criteria");
      }

      for (var name in this._criteria) {
        var expr = this._criteria[name];
        if (_.contains(Ops.compoundOperators, name)) {
          if (_.contains(["$not"], name)) {
            throw Error("Invalid operator");
          }
          this._processOperator(name, name, expr);
        } else {
          // normalize expression
          expr = normalize(expr);
          for (var operator in expr) {
            if (_.contains(['$options'], operator)) {
              continue;
            }
            // handle regex with options
            if (operator === "$regex") {
              var regex = expr[operator];
              var options = expr['$options'] || "";
              var modifiers = "";
              if (_.isString(regex)) {
                regex = new RegExp(regex);
              }
              modifiers += (regex.ignoreCase || options.indexOf("i") >= 0)? "i" : "";
              modifiers += (regex.multiline || options.indexOf("m") >= 0)? "m" : "";
              modifiers += (regex.global || options.indexOf("g") >= 0)? "g" : "";

              regex = new RegExp(regex.source, modifiers);
              expr[operator] = regex;
            }

            this._processOperator(name, operator, expr[operator]);
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
    find: function(collection, projection) {
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
          this._result = aggregator.run(this._result);
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
    skip: function(n) {
      _.extend(this._operators, {"$skip": n});
      return this;
    },

    /**
     * Sets the limit of the number of results to return.
     * You must apply limit() to the cursor before retrieving any documents.
     * @param {Number} n the number of results to limit to.
     * @return {Mingo.Cursor} Returns the cursor, so you can chain this call.
     */
    limit: function(n) {
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

  Mingo.Aggregator.prototype =  {

    /**
     * Executes the aggregation pipeline
     * @param collection an array of objects to process
     * @returns {Array}
     */
    run: function (collection) {
      if (!_.isEmpty(this._operators)) {
        // run aggregation pipeline
        for (var i = 0; i < this._operators.length; i++) {
          var operator = this._operators[i];
          for (var key in operator) {
            collection = pipelineOperators[key](collection, operator[key]);
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
        var n =  names.slice(i).join(".");
        var res = [];
        for (var j = 0; j < value.length; j++) {
          if (_.isObject(value[j])) {
            res.push(Mingo._get(value[j], n));
          }
        }
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
      pipeline = _.toArray(arguments).splice(1);
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
      if (!_.isArray(pipeline)) {
        pipeline = _.toArray(arguments);
      }
      var args = [this.toJSON()];
      Array.prototype.push.apply(args, pipeline);
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
    if (_.intersection(Ops.queryOperators, operator).length > 0) {
      throw new Error("Invalid name, cannot override default operator '" + operator + "'");
    }

    customOperators[operator] = fn;
    Ops.customOperators.push(operator);
    Ops.customOperators = _.uniq(Ops.customOperators);
  };

  var pipelineOperators = {

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
          obj[key] = accumulate(groups[index], key, expr[key]);
        }
        result.push(obj);
      });

      return result;
    },

    $match: function (collection, expr) {
      var query = new Mingo.Query(expr);
      return query.find(collection).all();
    },

    $project: function (collection, expr) {
      var whiteList = [], blacklist = [];

      for (var key in expr) {
        var obj = expr[key];
        if (obj === 0 || obj === false) {
          // can only exclude top-level "_id" field
          if (key !== settings.key) {
            throw new Error("The top-level _id field is the only field currently supported for exclusion");
          }
          blacklist.push(key);
        } else if (obj === 1 || obj === true || _.isString(obj) || _.isObject(obj)) {
          whiteList.push(key);
        }
      }

      if (blacklist.length === 0 && !_.contains(whiteList, settings.key)) {
        whiteList.push(settings.key);
        expr[settings.key] = 1;
      }

      if (whiteList.length === 0) {
        throw new Error("$projection requires at least one output field");
      }

      // result collection
      var projected = [];

      var record, objKeys, temp, cloneObj;
      for (var i = 0; i < collection.length; i++) {
        record = collection[i];
        objKeys = _.keys(record);
        cloneObj = {};

        _.each(whiteList, function (key) {
          var subExpr = expr[key];
          if (_.isString(subExpr)) {
            cloneObj[key] = computeValue(record, subExpr);
          } else if (subExpr === 1 || subExpr === true) {
            cloneObj[key] = computeValue(record, key);
          } else if(_.isObject(subExpr)) {
            var subKeys = _.keys(subExpr);
            var onlyKey = subKeys.length == 1? subKeys[0] : false;
            if (onlyKey !== false && _.contains(Ops.projectionOperators, onlyKey)) {
              temp = projectionOperators[onlyKey](record, key, subExpr[onlyKey]);
              if (!_.isUndefined(temp)) {
                cloneObj[key] = temp;
              }
            } else {
              cloneObj[key] = computeValue(record, subExpr);
            }
          }
        });

        projected.push(cloneObj);
      }

      return projected;
    },

    $limit: function (collection, value) {
      return _.first(collection, value);
    },

    $skip: function (collection, value) {
      return _.rest(collection, value);
    },

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
      };
      return result;
    },

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
          indexes = _.uniq(indexes);
          var indexes = _.sortBy(indexes, function (item) {
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
     * $and performs a logical AND operation on an array of two or more expressions (e.g. <expression1>, <expression2>, etc.)
     * and selects the documents that satisfy all the expressions in the array. The $and operator uses short-circuit evaluation.
     * If the first expression (e.g. <expression1>) evaluates to false, MongoDB will not evaluate the remaining expressions
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
          for (var i =0; i < queries.length; i++) {
            if (queries[i].test(obj) === false) {
              return false;
            }
          }
          return true;
        }
      };
    },

    /**
     * The $or operator performs a logical OR operation on an array of two or more <expressions> and selects
     * the documents that satisfy at least one of the <expressions>
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
     * $nor performs a logical NOR operation on an array of two or more <expressions> and
     * selects the documents that fail all the <expressions> in the array.
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
     * $not performs a logical NOT operation on the specified <operator-expression> and selects the documents
     * that do not match the <operator-expression>. This includes documents that do not contain the field.
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

    $where: function (selector, value) {
      throw Error("$where is Bad Bad Bad and SHALL NOT be implemented! Sorry :(");
    }

  };

  var simpleOperators = {

    /**
     * Pseudo operator, introduced for convenience and consistency
     * Checks that two values are equal
     *
     * @param a
     * @param b
     * @returns {*}
     */
    $eq: function (a, b) {
      a = _.isArray(a)? a : [a];
      a = _.find(a, function (val) {
        return _.isEqual(val, b);
      });
      return a !== undefined;
    },

    /**
     * $ne selects the documents where the value of the field is not equal (i.e. !=) to the specified value.
     * This includes documents that do not contain the field
     * @param a
     * @param b
     * @returns {boolean}
     */
    $ne: function (a, b) {
      return !this.$eq(a, b);
    },

    /**
     * $in selects the documents where the field value equals any value in the specified array (e.g. <value1>, <value2>, etc.)
     *
     * @param a
     * @param b
     * @returns {*}
     */
    $in: function (a, b) {
      a = _.isArray(a)? a : [a];
      return _.intersection(a, b).length > 0;
    },

    /**
     * $nin selects the documents where:
     * the field value is not in the specified array or
     * the field does not exist.
     *
     * @param a
     * @param b
     * @returns {*|boolean}
     */
    $nin: function (a, b) {
      return _.isUndefined(a) || !this.$in(a, b);
    },

    /**
     * $lt selects the documents where the value of the field is less than (i.e. <) the specified value.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $lt: function(a, b) {
      a = _.isArray(a)? a : [a];
      a = _.find(a, function (val) {
        return val < b
      });
      return a !== undefined;
    },

    /**
     * $lte selects the documents where the value of the field is less than or equal to (i.e. <=) the specified value.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $lte: function(a, b) {
      a = _.isArray(a)? a : [a];
      a = _.find(a, function (val) {
        return val <= b
      });
      return a !== undefined;
    },

    /**
     * $gt selects those documents where the value of the field is greater than (i.e. >) the specified value.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $gt: function(a, b) {
      a = _.isArray(a)? a : [a];
      a = _.find(a, function (val) {
        return val > b
      });
      return a !== undefined;
    },

    /**
     * $gte selects the documents where the value of the field is greater than or equal to (i.e. >=) a specified value (e.g. value.)
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $gte: function(a, b) {
      a = _.isArray(a)? a : [a];
      a = _.find(a, function (val) {
        return val >= b
      });
      return a !== undefined;
    },

    /**
     * $mod selects the documents where the field value divided by the divisor has the specified remainder.
     * @param a
     * @param b
     * @returns {*|boolean|boolean}
     */
    $mod: function (a, b) {
      a = _.isArray(a)? a : [a];
      a = _.find(a, function (val) {
        return _.isNumber(val) && _.isArray(b) && b.length === 2 && (val % b[0]) === b[1];
      });
      return a !== undefined;
    },

    /**
     * The $regex operator provides regular expression capabilities for pattern matching strings in queries.
     * MongoDB uses Perl compatible regular expressions
     * @param a
     * @param b
     * @returns {*|boolean}
     */
    $regex: function (a, b) {
      a = _.isArray(a)? a : [a];
      a = _.find(a, function (val) {
        return _.isString(val) && _.isRegExp(b) && (!!val.match(b));
      });
      return a !== undefined;
    },

    /**
     * $exists selects the documents that contain the field if <boolean> is true.
     * If <boolean> is false, the query only returns the documents that do not contain the field.
     * @param a
     * @param b
     * @returns {boolean|*|boolean}
     */
    $exists: function (a, b) {
      return (b === false && _.isUndefined(a)) || (b === true && !_.isUndefined(a));
    },

    /**
     * $all selects the documents where the field holds an array which contains all elements (e.g. <value>, <value1>, etc.) in the array
     * @param a
     * @param b
     * @returns {*}
     */
    $all: function (a, b) {
      // order of arguments matter. underscore maintains order after intersection
      if (_.isArray(a) && _.isArray(b)) {
        return _.intersection(b, a).length === b.length;
      }
      return false;
    },

    /**
     * The $size operator matches any array with the number of elements specified by the argument. For example:
     * @param a
     * @param b
     * @returns {*|boolean}
     */
    $size: function (a, b) {
      return _.isArray(a) && _.isNumber(b) && (a.length === b);
    },

    /**
     * The $elemMatch operator matches more than one component within an array element
     * @param a
     * @param b
     */
    $elemMatch: function (a, b) {
      if (_.isArray(a) && !_.isEmpty(a)) {
        var query = new Mingo.Query(b);
        for (var i = 0; i < a.length; i++) {
          if (!query.test(a[i])) {
            return false;
          }
        }
        return true;
      }
      return false;
    },

    /**
     * $type selects the documents where the value of the field is the specified BSON type
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

    $: function (obj, field, expr) {
      throw new Error("$ not implemented");
    },

    /**
     * The $elemMatch projection operator limits the contents of an array field that is
     * included in the query results to contain only the array element that matches the $elemMatch condition
     *
     * @param obj
     * @param field
     * @param expr
     * @returns {*}
     */
    $elemMatch: function (obj, field, expr) {
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
     * The $slice operator controls the number of items of an array that a query returns
     * @param obj
     * @param field
     * @param expr
     */
    $slice: function (obj, field, expr) {
      var array = Mingo._resolve(obj, field);

      if (_.isUndefined(array) || !_.isArray(array)) {
        return undefined;
      }
      if (!_.isArray(expr)) {
        expr = [expr];
      }
      return Array.prototype.slice.apply(array, expr);
    }
  };

  var groupOperators = {

    $addToSet: function (collection, expr) {
      var result = _.map(collection, function (obj) {
        return computeValue(obj, expr);
      });
      return _.uniq(result);
    },

    $sum: function (collection, expr) {
      if (_.isNumber(expr)) {
        // take a short cut if expr is number literal
        return collection.length * expr;
      }
      var result = _.reduce(collection, function (acc, obj) {
        // pass empty field to avoid naming conflicts with fields on documents
        return acc + computeValue(obj, expr);
      }, 0);
      return result;
    },

    $max: function (collection, expr) {
      var obj = _.max(collection, function (obj) {
        return computeValue(obj, expr);
      });
      return computeValue(obj, expr);
    },

    $min: function (collection, expr) {
      var obj = _.min(collection, function (obj) {
        return computeValue(obj, expr);
      });
      return computeValue(obj, expr);
    },

    $avg: function (collection, expr) {
      return this.$sum(collection, expr) / collection.length;
    },

    $push: function (collection, expr) {
      return _.map(collection, function (obj) {
        return computeValue(obj, expr);
      });
    },

    $first: function (collection, expr) {
      return (collection.length > 0)? computeValue(collection[0], expr) : undefined;
    },

    $last: function (collection, expr) {
      return (collection.length > 0)? computeValue(collection[collection.length - 1], expr) : undefined;
    }
  };

  var aggregateOperators = {

    $add: function (ctx) {
      var result = 0;
      var values = _.toArray(arguments).slice(1)[0];
      flatten(ctx, values, function (val) {
        result += val;
      });
      return result;
    },

    $subtract: function (ctx) {
      var values = _.toArray(arguments).slice(1)[0];
      var args = flatten(ctx, values);
      return args[0] - args[1];
    },

    $divide: function (ctx) {
      var values = _.toArray(arguments).slice(1)[0];
      var args = flatten(ctx, values);
      return args[0] / args[1];
    },

    $multiply: function (ctx) {
      var values = _.toArray(arguments).slice(1)[0];
      var result = 1;
      flatten(ctx, values, function (val) {
        result *= val;
      });
      return result;
    },

    $mod: function (ctx) {
      var values = _.toArray(arguments).slice(1)[0];
      var args = flatten(ctx, values);
      return args[0] % args[1];
    },

    $cmp: function (ctx) {
      var values = _.toArray(arguments).slice(1)[0];
      var args = flatten(ctx, values);
      if (args[0] > args[1]) {
        return 1;
      }
      return (args[0] < args[1])? -1 : 0;
    },

    $concat: function (ctx) {
      var values = _.toArray(arguments).slice(1)[0];
      var args = flatten(ctx, values);
      return args.join("");
    },

    $strcasecmp: function (ctx) {
      var values = _.toArray(arguments).slice(1)[0];
      var args = flatten(ctx, values);
      args[0] = args[0].toUpperCase();
      args[1] = args[1].toUpperCase();
      if (args[0] > args[1]) {
        return 1;
      }
      return (args[0] < args[1])? -1 : 0;
    },

    $substr: function (ctx) {
      var values = _.toArray(arguments).slice(1)[0];
      var args = flatten(ctx, values);
      return args[0].substr(args[1], args[2]);
    },

    $toLower: function (ctx) {
      var values = _.toArray(arguments).slice(1)[0];
      var args = flatten(ctx, values);
      return args[0].toLowerCase();
    },

    $toUpper: function (ctx) {
      var values = _.toArray(arguments).slice(1)[0];
      var args = flatten(ctx, values);
      return args[0].toUpperCase();
    }
  };

  // mixin from simple operators
  _.each(["$eq", "$ne", "$gt", "$gte", "$lt", "$lte"], function (op) {
    aggregateOperators[op] = function (ctx) {
      var values = _.toArray(arguments).slice(1)[0];
      var args = flatten(ctx, values);
      simpleOperators[op](args[0], args[1]);
    };
  });

  var Ops = {
    simpleOperators: _.keys(simpleOperators),
    compoundOperators: _.keys(compoundOperators),
    aggregateOperators: _.keys(aggregateOperators),
    groupOperators: _.keys(groupOperators),
    pipelineOperators: _.keys(pipelineOperators),
    projectionOperators: _.keys(projectionOperators),
    customOperators: []
  };
  Ops.queryOperators = _.union(Ops.simpleOperators, Ops.compoundOperators);


  var flatten = function(obj, args, action) {
    for (var i = 0; i < args.length; i++) {
      if (_.isString(args[i]) && args[i].length >  0) {
        args[i] = computeValue(obj, args[i]);
      }
      if (typeof action === "function") {
        action(args[i]);
      }
    }
    return args;
  };

  /**
   * Returns the result of evaluating a $group aggregate operation over a collection
   * @param collection
   * @param field
   * @param expr
   * @returns {*}
   */
  var accumulate = function (collection, field, expr) {
    if (_.contains(Ops.groupOperators, field)) {
      return groupOperators[field](collection, expr);
    }

    if (_.isObject(expr)) {
      var result = {};
      for (var key in expr) {
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
      return result;
    }

    return null;
  };

  /**
   * Computes the actual value to use in aggregation from the given expression for the record
   * @param record
   * @param expr
   * @param field
   * @returns {*}
   */
  var computeValue = function (record, expr, field) {

    // if the field of the object is an aggregate operator
    if (_.contains(Ops.aggregateOperators, field)) {
      return aggregateOperators[field](record, expr);
    }

    // if expr is a variable for an object field
    // field not used in this case
    if (_.isString(expr) && expr.length > 0 && expr[0] === "$") {
      return Mingo._resolve(record, expr.slice(1));
    }

    if (_.isObject(expr)) {
      var result = {};
      for (var key in expr) {
        result[key] = computeValue(record, expr[key], key);

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
      return result;
    }

    // check and return value if already in a resolved state
    for (var i = 0; i < primitives.length; i++) {
      if (primitives[i](expr)) {
        return expr;
      }
    }

    return undefined;
  };

}).call(this);