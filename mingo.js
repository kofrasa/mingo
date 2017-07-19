// mingo.js
// Copyright (c) 2017 Francis Asante <kofrasa@gmail.com>
// MIT
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (global, factory) {
  (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : factory(global.mingo = global.mingo || {});
})(undefined, function (exports) {
  'use strict';

  /**
   * Utility functions
   */

  function assert(condition, message) {
    if (falsey(condition)) err(message);
  }

  /**
   * Deep clone an object
   */
  function clone(arg) {
    switch (jsType(arg)) {
      case 'array':
        return arg.map(clone);
      case 'object':
        return map(arg, clone);
      default:
        return arg;
    }
  }

  function getType(v) {
    if (v === null) return "Null";
    if (v === undefined) return "Undefined";
    return v.constructor.name;
  }
  function jsType(v) {
    return getType(v).toLowerCase();
  }
  function isBoolean(v) {
    return jsType(v) === 'boolean';
  }
  function isString(v) {
    return jsType(v) === 'string';
  }
  function isNumber(v) {
    return jsType(v) === 'number';
  }
  function isArray(v) {
    return jsType(v) === 'array';
  }
  function isObject(v) {
    return jsType(v) === 'object';
  }
  function isObjectLike(v) {
    return v === Object(v);
  } // objects, arrays, functions, date, custom object
  function isDate(v) {
    return jsType(v) === 'date';
  }
  function isRegExp(v) {
    return jsType(v) === 'regexp';
  }
  function isFunction(v) {
    return jsType(v) === 'function';
  }
  function isNil(v) {
    return isNull(v) || isUndefined(v);
  }
  function isNull(v) {
    return jsType(v) === 'null';
  }
  function isUndefined(v) {
    return jsType(v) === 'undefined';
  }
  function inArray(arr, item) {
    return arr.includes(item);
  }
  function notInArray(arr, item) {
    return !arr.includes(item);
  }
  function truthy(arg) {
    return !!arg;
  }
  function falsey(arg) {
    return !arg;
  }
  function isEmpty(x) {
    return isNil(x) || isArray(x) && x.length === 0 || isObject(x) && keys(x).length === 0 || !x;
  }
  // TODO: convert arguments to array
  function array(x) {
    return isArray(x) ? x : [x];
  }
  function has(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }
  function err(s) {
    throw new Error(s);
  }
  function keys(o) {
    return Object.keys(o);
  }

  // ////////////////// UTILS ////////////////////

  function addMeta(obj, value) {
    obj.__mingo__ = Object.assign(obj.__mingo__ || {}, value);
  }

  function hasMeta(obj, value) {
    return has(obj, '__mingo__') && isObject(value) && isEqual(Object.assign({}, obj.__mingo__, value), obj.__mingo__);
  }

  function dropMeta(obj) {
    if (has(obj, '__mingo__')) delete obj.__mingo__;
  }

  /**
   * Iterate over an array or object
   * @param  {Array|Object} obj An object-like value
   * @param  {Function} callback The callback to run per item
   * @param  {*}   ctx  The object to use a context
   * @return {void}
   */
  function each(obj, callback) {
    var ctx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    assert(obj === Object(obj), "Cannot iterate over object of type '" + jsType(obj) + "'");

    var done = false;
    var halt = function halt() {
      done = true;
      err('halt');
    };

    if (isArray(obj)) {
      for (var i = 0, len = obj.length; i < len; i++) {
        try {
          callback.call(ctx, obj[i], i, obj, halt);
        } catch (e) {
          assert(done, e.message);
          return;
        }
      }
    } else {
      for (var k in obj) {
        if (has(obj, k)) {
          try {
            callback.call(ctx, obj[k], k, obj, halt);
          } catch (e) {
            assert(done, e.message);
            return;
          }
        }
      }
    }
  }

  /**
   * Transform values in a collection
   *
   * @param  {Array|Object}   obj   An array/object whose values to transform
   * @param  {Function} callback The transform function
   * @param  {*}   ctx The value to use as the "this" context for the transform
   * @return {Array|Object} Result object after applying the transform
   */
  function map(obj, callback) {
    var ctx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    if (isArray(obj)) {
      return obj.map(callback, ctx);
    } else if (isObject(obj)) {
      var o = {};
      var arr = keys(obj);
      for (var k, i = 0, len = arr.length; i < len; i++) {
        k = arr[i];
        o[k] = callback.call(ctx, obj[k], k);
      }
      return o;
    }
    err('Input must be an Array or Object type');
  }

  /**
   * Returns the intersection between two arrays
   *
   * @param  {Array} xs The first array
   * @param  {Array} ys The second array
   * @return {Array}    Result array
   */
  function intersection(xs, ys) {
    return xs.filter(inArray.bind(null, ys));
  }

  /**
   * Returns the union of two arrays
   *
   * @param  {Array} xs The first array
   * @param  {Array} ys The second array
   * @return {Array}   The result array
   */
  function union(xs, ys) {
    var arr = [];
    into(arr, xs);
    into(arr, ys.filter(notInArray.bind(null, xs)));
    return arr;
  }

  /**
   * Flatten the array
   *
   * @param  {Array} xs The array to flatten
   * @param {Number} depth The number of nested lists to iterate
   */

  /**
   * Determine whether two values are the same or strictly equivalent
   *
   * @param  {*}  a The first value
   * @param  {*}  b The second value
   * @return {Boolean}   Result of comparison
   */
  function isEqual(a, b) {
    // strictly equal must be equal.
    if (a === b) return true;

    // unequal types cannot be equal.
    var type = jsType(a);
    if (type !== jsType(b)) return false;

    // we treat NaN as the same
    if (type === 'number' && isNaN(a) && isNaN(b)) return true;

    // leverage toString for Date and RegExp types
    if (inArray(['date', 'regexp'], type)) return a.toString() === b.toString();

    if (type === 'array') {
      if (a.length === b.length && a.length === 0) return true;
      if (a.length !== b.length) return false;
      for (var i = 0, len = a.length; i < len; i++) {
        if (!isEqual(a[i], b[i])) return false;
      }
    } else if ([a, b].every(isObject)) {
      // deep compare objects
      var ka = keys(a);
      var kb = keys(b);

      // check length of keys early
      if (ka.length !== kb.length) return false;

      // we know keys are strings so we sort before comparing
      ka.sort();
      kb.sort();

      // compare keys
      if (!isEqual(ka, kb)) return false;

      // back to the drawing board
      for (var _i = 0, _len = ka.length; _i < _len; _i++) {
        var temp = ka[_i];
        if (!isEqual(a[temp], b[temp])) return false;
      }
    } else {
      // we do not know how to compare unknown types
      return false;
    }
    // best effort says values are equal :)
    return true;
  }

  /**
   * Return a new unique version of the collection
   * @param  {Array} xs The input collection
   * @return {Array}    A new collection with unique values
   */
  function unique(xs) {
    var h = {};
    var arr = [];
    each(xs, function (item) {
      var k = getHash(item);
      if (!has(h, k)) {
        arr.push(item);
        h[k] = 0;
      }
    });
    return arr;
  }

  // encode value using a simple optimistic scheme
  function encode(value) {
    return JSON.stringify({ '': value }) + jsType(value) + value;
  }

  // http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
  // http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  function getHash(value) {
    var hash = 0,
        i = void 0,
        chr = void 0,
        len = void 0,
        s = encode(value);
    if (s.length === 0) return hash;
    for (i = 0, len = s.length; i < len; i++) {
      chr = s.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Returns a (stably) sorted copy of list, ranked in ascending order by the results of running each value through iteratee
   *
   * This implementation treats null/undefined sort keys as less than every other type
   *
   * @param  {Array}   collection
   * @param  {Function} fn The function used to resolve sort keys
   * @param {Object} ctx The context to use for calling `fn`
   * @return {Array} Returns a new sorted array by the given iteratee
   */
  function sortBy(collection, fn) {
    var ctx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    var sortKeys = {};
    var sorted = [];
    var len = collection.length;
    var result = [];

    for (var i = 0; i < len; i++) {
      var obj = collection[i];
      var key = fn.call(ctx, obj, i);
      if (isNil(key)) {
        // objects with null keys will go in first
        result.push(obj);
      } else {
        var hash = getHash(obj);
        if (!has(sortKeys, hash)) {
          sortKeys[hash] = [key, i];
        }
        sorted.push(obj);
      }
    }
    // use native array sorting but enforce stableness
    sorted.sort(function (a, b) {
      var A = sortKeys[getHash(a)];
      var B = sortKeys[getHash(b)];
      if (A[0] < B[0]) return -1;
      if (A[0] > B[0]) return 1;
      if (A[1] < B[1]) return -1;
      if (A[1] > B[1]) return 1;
      return 0;
    });

    into(result, sorted);
    assert(result.length === collection.length, 'sortBy must retain collection length');
    return result;
  }

  /**
   * Groups the collection into sets by the returned key
   *
   * @param collection
   * @param fn {Function} to compute the group key of an item in the collection
   * @param ctx {Object} The context to use for calling `fn`
   * @returns {{keys: Array, groups: Array}}
   */
  function groupBy(collection, fn, ctx) {
    var result = {
      'keys': [],
      'groups': []
    };

    var lookup = {};

    each(collection, function (obj) {
      var key = fn.call(ctx, obj);
      var hash = getHash(key);
      var index = -1;

      if (isUndefined(lookup[hash])) {
        index = result.keys.length;
        lookup[hash] = index;
        result.keys.push(key);
        result.groups.push([]);
      }
      index = lookup[hash];
      result.groups[index].push(obj);
    });

    assert(result.keys.length === result.groups.length, 'Cardinality must be equal for groups and keys');
    return result;
  }

  /**
   * Push elements in given array into target array
   *
   * @param {*} target The array to push into
   * @param {*} xs The array of elements to push
   */
  function into(target, xs) {
    Array.prototype.push.apply(target, xs);
  }

  /**
   * Find the insert index for the given key in a sorted array.
   *
   * @param {*} array The sorted array to search
   * @param {*} key The search key
   */
  function findInsertIndex(array, key) {
    // uses binary search
    var lo = 0;
    var hi = array.length - 1;
    while (lo <= hi) {
      var mid = Math.round(lo + (hi - lo) / 2);
      if (key < array[mid]) {
        hi = mid - 1;
      } else if (key > array[mid]) {
        lo = mid + 1;
      } else {
        return mid;
      }
    }
    return lo;
  }

  /**
   * This is a generic memoization function
   *
   * This implementation uses a cache independent of the function being memoized
   * to allow old values to be garbage collected when the memoized function goes out of scope.
   *
   * @param {*} fn The function object to memoize
   */
  function memoize(fn) {
    var _this = this;

    return function (cache) {
      return function () {
        for (var _len2 = arguments.length, args = Array(_len2), _key = 0; _key < _len2; _key++) {
          args[_key] = arguments[_key];
        }

        var key = getHash(args);
        if (!has(cache, key)) {
          cache[key] = fn.apply(_this, args);
        }
        return cache[key];
      };
    }({/* storage */});
  }

  /**
   * Group stage Accumulator Operators. https://docs.mongodb.com/manual/reference/operator/aggregation-group/
   */

  var groupOperators = {

    /**
     * Returns an array of all the unique values for the selected field among for each document in that group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $addToSet: function $addToSet(collection, expr) {
      return unique(this.$push(collection, expr));
    },


    /**
     * Returns the sum of all the values in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $sum: function $sum(collection, expr) {
      if (!isArray(collection)) return 0;

      if (isNumber(expr)) {
        // take a short cut if expr is number literal
        return collection.length * expr;
      }
      return this.$push(collection, expr).filter(isNumber).reduce(function (acc, n) {
        return acc + n;
      }, 0);
    },


    /**
     * Returns the highest value in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $max: function $max(collection, expr) {
      var mapped = this.$push(collection, expr);
      return mapped.reduce(function (acc, n) {
        return isNil(acc) || n > acc ? n : acc;
      }, undefined);
    },


    /**
     * Returns the lowest value in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $min: function $min(collection, expr) {
      var mapped = this.$push(collection, expr);
      return mapped.reduce(function (acc, n) {
        return isNil(acc) || n < acc ? n : acc;
      }, undefined);
    },


    /**
     * Returns an average of all the values in a group.
     *
     * @param collection
     * @param expr
     * @returns {number}
     */
    $avg: function $avg(collection, expr) {
      var data = this.$push(collection, expr).filter(isNumber);
      var sum = data.reduce(function (acc, n) {
        return acc + n;
      }, 0);
      return sum / (data.length || 1);
    },


    /**
     * Returns an array of all values for the selected field among for each document in that group.
     *
     * @param collection
     * @param expr
     * @returns {Array|*}
     */
    $push: function $push(collection, expr) {
      if (isNil(expr)) return collection;
      return collection.map(function (obj) {
        return computeValue(obj, expr, null);
      });
    },


    /**
     * Returns the first value in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $first: function $first(collection, expr) {
      return collection.length > 0 ? computeValue(collection[0], expr) : undefined;
    },


    /**
     * Returns the last value in a group.
     *
     * @param collection
     * @param expr
     * @returns {*}
     */
    $last: function $last(collection, expr) {
      return collection.length > 0 ? computeValue(collection[collection.length - 1], expr) : undefined;
    },


    /**
     * Returns the population standard deviation of the input values.
     * @param  {Array} collection
     * @param  {Object} expr
     * @return {Number}
     */
    $stdDevPop: function $stdDevPop(collection, expr) {
      var data = this.$push(collection, expr).filter(isNumber);
      return stddev({ data: data, sampled: false });
    },


    /**
     * Returns the sample standard deviation of the input values.
     * @param  {Array} collection
     * @param  {Object} expr
     * @return {Number|null}
     */
    $stdDevSamp: function $stdDevSamp(collection, expr) {
      var data = this.$push(collection, expr).filter(isNumber);
      return stddev({ data: data, sampled: true });
    }
  };

  var arithmeticOperators = {

    /**
     * Returns the absolute value of a number.
     * https://docs.mongodb.com/manual/reference/operator/aggregation/abs/#exp._S_abs
     * @param obj
     * @param expr
     * @return {Number|null|NaN}
     */
    $abs: function $abs(obj, expr) {
      var val = computeValue(obj, expr, null);
      return val === null || val === undefined ? null : Math.abs(val);
    },


    /**
     * Computes the sum of an array of numbers.
     *
     * @param obj
     * @param expr
     * @returns {Object}
     */
    $add: function $add(obj, expr) {
      var args = computeValue(obj, expr, null);
      return args.reduce(function (acc, num) {
        return acc + num;
      }, 0);
    },


    /**
     * Returns the smallest integer greater than or equal to the specified number.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $ceil: function $ceil(obj, expr) {
      var arg = computeValue(obj, expr, null);
      if (isNaN(arg)) return NaN;
      if (isNil(arg)) return null;
      assert(isNumber(arg), '$ceil must be a valid expression that resolves to a number.');
      return Math.ceil(arg);
    },


    /**
     * Takes two numbers and divides the first number by the second.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $divide: function $divide(obj, expr) {
      var args = computeValue(obj, expr, null);
      return args[0] / args[1];
    },


    /**
     * Raises Euler’s number (i.e. e ) to the specified exponent and returns the result.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $exp: function $exp(obj, expr) {
      var arg = computeValue(obj, expr, null);
      if (isNaN(arg)) return NaN;
      if (isNil(arg)) return null;
      assert(isNumber(arg), '$exp must be a valid expression that resolves to a number.');
      return Math.exp(arg);
    },


    /**
     * Returns the largest integer less than or equal to the specified number.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $floor: function $floor(obj, expr) {
      var arg = computeValue(obj, expr, null);
      if (isNaN(arg)) return NaN;
      if (isNil(arg)) return null;
      assert(isNumber(arg), '$floor must be a valid expression that resolves to a number.');
      return Math.floor(arg);
    },


    /**
     * Calculates the natural logarithm ln (i.e loge) of a number and returns the result as a double.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $ln: function $ln(obj, expr) {
      var arg = computeValue(obj, expr, null);
      if (isNaN(arg)) return NaN;
      if (isNil(arg)) return null;
      assert(isNumber(arg), '$ln must be a valid expression that resolves to a number.');
      return Math.log(arg);
    },


    /**
     * Calculates the log of a number in the specified base and returns the result as a double.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $log: function $log(obj, expr) {
      var args = computeValue(obj, expr, null);
      assert(isArray(args) && args.length === 2, '$log must be a valid expression that resolves to an array of 2 items');
      if (args.some(isNaN)) return NaN;
      if (args.some(isNil)) return null;
      assert(args.every(isNumber), '$log expression must resolve to array of 2 numbers');
      return Math.log10(args[0]) / Math.log10(args[1]);
    },


    /**
     * Calculates the log base 10 of a number and returns the result as a double.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $log10: function $log10(obj, expr) {
      var arg = computeValue(obj, expr, null);
      if (isNaN(arg)) return NaN;
      if (isNil(arg)) return null;
      assert(isNumber(arg), '$log10 must be a valid expression that resolves to a number.');
      return Math.log10(arg);
    },


    /**
     * Takes two numbers and calculates the modulo of the first number divided by the second.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $mod: function $mod(obj, expr) {
      var args = computeValue(obj, expr, null);
      return args[0] % args[1];
    },


    /**
     * Computes the product of an array of numbers.
     *
     * @param obj
     * @param expr
     * @returns {Object}
     */
    $multiply: function $multiply(obj, expr) {
      var args = computeValue(obj, expr, null);
      return args.reduce(function (acc, num) {
        return acc * num;
      }, 1);
    },


    /**
     * Raises a number to the specified exponent and returns the result.
     *
     * @param obj
     * @param expr
     * @returns {Object}
     */
    $pow: function $pow(obj, expr) {
      var args = computeValue(obj, expr, null);

      assert(isArray(args) && args.length === 2 && args.every(isNumber), '$pow must be a valid expression that resolves to an array of 2 numbers');
      assert(!(args[0] === 0 && args[1] < 0), '$pow cannot raise 0 to a negative exponent');

      return Math.pow(args[0], args[1]);
    },


    /**
     * Calculates the square root of a positive number and returns the result as a double.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $sqrt: function $sqrt(obj, expr) {
      var n = computeValue(obj, expr, null);
      if (isNaN(n)) return NaN;
      if (isNil(n)) return null;
      assert(isNumber(n) && n > 0, '$sqrt must be a valid expression that resolves to a non-negative number.');
      return Math.sqrt(n);
    },


    /**
     * Takes an array that contains two numbers or two dates and subtracts the second value from the first.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $subtract: function $subtract(obj, expr) {
      var args = computeValue(obj, expr, null);
      return args[0] - args[1];
    },


    /**
     * Truncates a number to its integer.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $trunc: function $trunc(obj, expr) {
      var n = computeValue(obj, expr, null);
      if (isNaN(n)) return NaN;
      if (isNil(n)) return null;
      assert(isNumber(n) && n > 0, '$trunc must be a valid expression that resolves to a non-negative number.');
      return Math.trunc(n);
    }
  };

  var arrayOperators = {
    /**
     * Returns the element at the specified array index.
     *
     * @param  {Object} obj
     * @param  {*} expr
     * @return {*}
     */
    $arrayElemAt: function $arrayElemAt(obj, expr) {
      var arr = computeValue(obj, expr, null);
      assert(isArray(arr) && arr.length === 2, '$arrayElemAt expression must resolve to an array of 2 elements');
      assert(isArray(arr[0]), 'First operand to $arrayElemAt must resolve to an array');
      assert(isNumber(arr[1]), 'Second operand to $arrayElemAt must resolve to an integer');
      var idx = arr[1];
      arr = arr[0];
      if (idx < 0 && Math.abs(idx) <= arr.length) {
        return arr[idx + arr.length];
      } else if (idx >= 0 && idx < arr.length) {
        return arr[idx];
      }
      return undefined;
    },


    /**
     * Concatenates arrays to return the concatenated array.
     *
     * @param  {Object} obj
     * @param  {*} expr
     * @return {*}
     */
    $concatArrays: function $concatArrays(obj, expr) {
      var arr = computeValue(obj, expr, null);
      assert(isArray(arr) && arr.length === 2, '$concatArrays expression must resolve to an array of 2 elements');

      if (arr.some(isNil)) return null;

      return arr[0].concat(arr[1]);
    },


    /**
     * Selects a subset of the array to return an array with only the elements that match the filter condition.
     *
     * @param  {Object} obj  [description]
     * @param  {*} expr [description]
     * @return {*}      [description]
     */
    $filter: function $filter(obj, expr) {
      var input = computeValue(obj, expr['input'], null);
      var asVar = expr['as'];
      var condExpr = expr['cond'];

      assert(isArray(input), "'input' expression for $filter must resolve to an array");

      return input.filter(function (o) {
        // inject variable
        var tempObj = {};
        tempObj['$' + asVar] = o;
        return computeValue(tempObj, condExpr, null) === true;
      });
    },


    /**
     * Searches an array for an occurence of a specified value and returns the array index of the first occurence.
     * If the substring is not found, returns -1.
     *
     * @param  {Object} obj
     * @param  {*} expr
     * @return {*}
     */
    $indexOfArray: function $indexOfArray(obj, expr) {
      var arr = computeValue(obj, expr, null);
      if (isNil(arr)) return null;

      var array$$1 = arr[0];
      if (isNil(array$$1)) return null;

      assert(isArray(array$$1), 'First operand for $indexOfArray must resolve to an array.');

      var searchValue = arr[1];
      if (isNil(searchValue)) return null;

      var start = arr[2] || 0;
      var end = arr[3] || array$$1.length;

      if (end < array$$1.length) {
        array$$1 = array$$1.slice(start, end);
      }

      return array$$1.indexOf(searchValue, start);
    },


    /**
     * Determines if the operand is an array. Returns a boolean.
     *
     * @param  {Object}  obj
     * @param  {*}  expr
     * @return {Boolean}
     */
    $isArray: function $isArray(obj, expr) {
      return isArray(computeValue(obj, expr, null));
    },


    /**
     * Returns an array whose elements are a generated sequence of numbers.
     *
     * @param  {Object} obj
     * @param  {*} expr
     * @return {*}
     */
    $range: function $range(obj, expr) {
      var arr = computeValue(obj, expr, null);
      var start = arr[0];
      var end = arr[1];
      var step = arr[2] || 1;

      var result = [];

      while (start < end && step > 0 || start > end && step < 0) {
        result.push(start);
        start += step;
      }

      return result;
    },


    /**
     * Returns an array with the elements in reverse order.
     *
     * @param  {Object} obj
     * @param  {*} expr
     * @return {*}
     */
    $reverseArray: function $reverseArray(obj, expr) {
      var arr = computeValue(obj, expr, null);

      if (isNil(arr)) return null;
      assert(isArray(arr), '$reverseArray expression must resolve to an array');

      var result = [];
      for (var i = arr.length - 1; i > -1; i--) {
        result.push(arr[i]);
      }
      return result;
    },


    /**
     * Applies an expression to each element in an array and combines them into a single value.
     *
     * @param {Object} obj
     * @param {*} expr
     */
    $reduce: function $reduce(obj, expr) {
      var input = computeValue(obj, expr['input'], null);
      var initialValue = computeValue(obj, expr['initialValue'], null);
      var inExpr = expr['in'];

      if (isNil(input)) return null;
      assert(isArray(input), "'input' expression for $reduce must resolve to an array");

      return input.reduce(function (acc, n) {
        return computeValue({ '$value': acc, '$this': n }, inExpr, null);
      }, initialValue);
    },


    /**
     * Counts and returns the total the number of items in an array.
     *
     * @param obj
     * @param expr
     */
    $size: function $size(obj, expr) {
      var value = computeValue(obj, expr, null);
      return isArray(value) ? value.length : undefined;
    },


    /**
     * Returns a subset of an array.
     *
     * @param  {Object} obj
     * @param  {*} expr
     * @return {*}
     */
    $slice: function $slice(obj, expr) {
      var arr = computeValue(obj, expr, null);
      return slice(arr[0], arr[1], arr[2]);
    },


    /**
     * Merge two lists together.
     *
     * Transposes an array of input arrays so that the first element of the output array would be an array containing,
     * the first element of the first input array, the first element of the second input array, etc.
     *
     * @param  {Obj} obj
     * @param  {*} expr
     * @return {*}
     */
    $zip: function $zip(obj, expr) {
      var inputs = computeValue(obj, expr.inputs, null);
      var useLongestLength = expr.useLongestLength || false;

      assert(isArray(inputs), "'inputs' expression must resolve to an array");
      assert(isBoolean(useLongestLength), "'useLongestLength' must be a boolean");

      if (isArray(expr.defaults)) {
        assert(truthy(useLongestLength), "'useLongestLength' must be set to true to use 'defaults'");
      }

      var zipCount = 0;

      for (var i = 0, len = inputs.length; i < len; i++) {
        var arr = inputs[i];

        if (isNil(arr)) return null;

        assert(isArray(arr), "'inputs' expression values must resolve to an array or null");

        zipCount = useLongestLength ? Math.max(zipCount, arr.length) : Math.min(zipCount || arr.length, arr.length);
      }

      var result = [];
      var defaults = expr.defaults || [];

      var _loop = function _loop(_i2) {
        var temp = inputs.map(function (val, index) {
          return isNil(val[_i2]) ? defaults[index] || null : val[_i2];
        });
        result.push(temp);
      };

      for (var _i2 = 0; _i2 < zipCount; _i2++) {
        _loop(_i2);
      }

      return result;
    }
  };

  var booleanOperators = {
    /**
     * Returns true only when all its expressions evaluate to true. Accepts any number of argument expressions.
     * @param obj
     * @param expr
     * @returns {boolean}
     */
    $and: function $and(obj, expr) {
      var value = computeValue(obj, expr, null);
      return truthy(value) && value.every(truthy);
    },

    /**
     * Returns true when any of its expressions evaluates to true. Accepts any number of argument expressions.
     * @param obj
     * @param expr
     * @returns {boolean}
     */
    $or: function $or(obj, expr) {
      var value = computeValue(obj, expr, null);
      return truthy(value) && value.some(truthy);
    },

    /**
     * Returns the boolean value that is the opposite of its argument expression. Accepts a single argument expression.
     * @param obj
     * @param expr
     * @returns {boolean}
     */
    $not: function $not(obj, expr) {
      return !computeValue(obj, expr[0], null);
    }
  };

  /**
   * Query and Projection Operators. https://docs.mongodb.com/manual/reference/operator/query/
   */

  var simpleOperators = {

    /**
     * Checks that two values are equal.
     *
     * @param a         The lhs operand as resolved from the object by the given selector
     * @param b         The rhs operand provided by the user
     * @returns {*}
     */
    $eq: function $eq(a, b) {
      // start with simple equality check
      if (isEqual(a, b)) return true;

      if (isArray(a)) {
        // is multi-valued lhs so we check each separately
        if (hasMeta(a, { isMulti: true })) {
          try {
            for (var i = 0; i < a.length; i++) {
              if (this.$eq(a[i], b)) {
                return true;
              }
            }
          } finally {
            dropMeta(a);
          }
        } else {
          // check one level deep
          return a.findIndex(isEqual.bind(null, b)) !== -1;
        }
      }
      return false;
    },


    /**
     * Matches all values that are not equal to the value specified in the query.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $ne: function $ne(a, b) {
      return !this.$eq(a, b);
    },


    /**
     * Matches any of the values that exist in an array specified in the query.
     *
     * @param a
     * @param b
     * @returns {*}
     */
    $in: function $in(a, b) {
      a = array(a);
      return intersection(a, b).length > 0;
    },


    /**
     * Matches values that do not exist in an array specified to the query.
     *
     * @param a
     * @param b
     * @returns {*|boolean}
     */
    $nin: function $nin(a, b) {
      return isNil(a) || !this.$in(a, b);
    },


    /**
     * Matches values that are less than the value specified in the query.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $lt: function $lt(a, b) {
      a = array(a).find(function (val) {
        return val < b;
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
    $lte: function $lte(a, b) {
      a = array(a).find(function (val) {
        return val <= b;
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
    $gt: function $gt(a, b) {
      a = array(a).find(function (val) {
        return val > b;
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
    $gte: function $gte(a, b) {
      a = array(a).find(function (val) {
        return val >= b;
      });
      return a !== undefined;
    },


    /**
     * Performs a modulo operation on the value of a field and selects documents with a specified result.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $mod: function $mod(a, b) {
      a = array(a).find(function (val) {
        return isNumber(val) && isArray(b) && b.length === 2 && val % b[0] === b[1];
      });
      return a !== undefined;
    },


    /**
     * Selects documents where values match a specified regular expression.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $regex: function $regex(a, b) {
      a = array(a).find(function (val) {
        return isString(val) && isRegExp(b) && !!val.match(b);
      });
      return a !== undefined;
    },


    /**
     * Matches documents that have the specified field.
     *
     * @param a
     * @param b
     * @returns {boolean}
     */
    $exists: function $exists(a, b) {
      return (b === false || b === 0) && isNil(a) || (b === true || b === 1) && !isNil(a);
    },


    /**
     * Matches arrays that contain all elements specified in the query.
     *
     * @param a
     * @param b
     * @returns boolean
     */
    $all: function $all(a, b) {
      var matched = false;
      if (isArray(a) && isArray(b)) {
        for (var i = 0, len = b.length; i < len; i++) {
          if (isObject(b[i]) && inArray(keys(b[i]), '$elemMatch')) {
            matched = matched || this.$elemMatch(a, b[i].$elemMatch);
          } else {
            // order of arguments matter
            return intersection(b, a).length === len;
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
    $size: function $size(a, b) {
      return isArray(a) && isNumber(b) && a.length === b;
    },


    /**
     * Selects documents if element in the array field matches all the specified $elemMatch condition.
     *
     * @param a
     * @param b
     */
    $elemMatch: function $elemMatch(a, b) {
      if (isArray(a) && !isEmpty(a)) {
        var query = new Query(b);
        for (var i = 0, len = a.length; i < len; i++) {
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
    $type: function $type(a, b) {
      switch (b) {
        case 1:
        case "double":
          return isNumber(a) && (a + '').indexOf('.') !== -1;
        case 2:
        case "string":
        case 5:
        case "bindata":
          return isString(a);
        case 3:
        case "object":
          return isObject(a);
        case 4:
        case "array":
          return isArray(a);
        case 6:
        case "undefined":
          return isNil(a);
        case 8:
        case "bool":
          return isBoolean(a);
        case 9:
        case "date":
          return isDate(a);
        case 10:
        case "null":
          return isNull(a);
        case 11:
        case "regex":
          return isRegExp(a);
        case 16:
        case "int":
          return isNumber(a) && a <= 2147483647 && (a + '').indexOf('.') === -1;
        case 18:
        case "long":
          return isNumber(a) && a > 2147483647 && a <= 9223372036854775807 && (a + '').indexOf('.') === -1;
        case 19:
        case "decimal":
          return isNumber(a);
        default:
          return false;
      }
    }
  };

  var queryOperators = {

    /**
     * Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
     *
     * @param selector
     * @param value
     * @returns {{test: Function}}
     */
    $and: function $and(selector, value) {
      assert(isArray(value), 'Invalid expression: $and expects value to be an Array');

      var queries = [];
      each(value, function (expr) {
        return queries.push(new Query(expr));
      });

      return {
        test: function test(obj) {
          for (var i = 0; i < queries.length; i++) {
            if (!queries[i].test(obj)) {
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
    $or: function $or(selector, value) {
      assert(isArray(value), 'Invalid expression. $or expects value to be an Array');

      var queries = [];
      each(value, function (expr) {
        return queries.push(new Query(expr));
      });

      return {
        test: function test(obj) {
          for (var i = 0; i < queries.length; i++) {
            if (queries[i].test(obj)) {
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
    $nor: function $nor(selector, value) {
      assert(isArray(value), 'Invalid expression. $nor expects value to be an Array');
      var query = this.$or('$or', value);
      return {
        test: function test(obj) {
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
    $not: function $not(selector, value) {
      var criteria = {};
      criteria[selector] = normalize(value);
      var query = new Query(criteria);
      return {
        test: function test(obj) {
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
    $where: function $where(selector, value) {
      if (!isFunction(value)) {
        value = new Function('return ' + value + ';');
      }
      return {
        test: function test(obj) {
          return value.call(obj) === true;
        }
      };
    }
  };

  // add simple query operators
  each(simpleOperators, function (fn, op) {
    queryOperators[op] = function (f, ctx) {
      return function (selector, value) {
        return {
          test: function test(obj) {
            // value of field must be fully resolved.
            var lhs = resolve(obj, selector);
            return f.call(ctx, lhs, value);
          }
        };
      };
    }(fn, simpleOperators);
  });

  var comparisonOperators = {
    /**
     * Compares two values and returns the result of the comparison as an integer.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $cmp: function $cmp(obj, expr) {
      var args = computeValue(obj, expr, null);
      if (args[0] > args[1]) return 1;
      if (args[0] < args[1]) return -1;
      return 0;
    }
  };
  // mixin comparison operators
  each(['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin'], function (op) {
    comparisonOperators[op] = function (obj, expr) {
      var args = computeValue(obj, expr, null);
      return simpleOperators[op](args[0], args[1]);
    };
  });

  /**
   * Conditional operators
   */

  var conditionalOperators = {

    /**
     * A ternary operator that evaluates one expression,
     * and depending on the result returns the value of one following expressions.
     *
     * @param obj
     * @param expr
     */
    $cond: function $cond(obj, expr) {
      var ifExpr = void 0,
          thenExpr = void 0,
          elseExpr = void 0;
      if (isArray(expr)) {
        assert(expr.length === 3, 'Invalid arguments for $cond operator');
        ifExpr = expr[0];
        thenExpr = expr[1];
        elseExpr = expr[2];
      } else if (isObject(expr)) {
        ifExpr = expr['if'];
        thenExpr = expr['then'];
        elseExpr = expr['else'];
      }
      var condition = computeValue(obj, ifExpr, null);
      return condition ? computeValue(obj, thenExpr, null) : computeValue(obj, elseExpr, null);
    },


    /**
     * An operator that evaluates a series of case expressions. When it finds an expression which
     * evaluates to true, it returns the resulting expression for that case. If none of the cases
     * evaluate to true, it returns the default expression.
     *
     * @param obj
     * @param expr
     */
    $switch: function $switch(obj, expr) {
      assert(expr.branches, 'Invalid arguments for $switch operator');

      var validBranch = expr.branches.find(function (branch) {
        assert(branch['case'] && branch['then'], 'Invalid arguments for $switch operator');
        return computeValue(obj, branch['case'], null);
      });

      if (validBranch) {
        return computeValue(obj, validBranch.then, null);
      } else if (!expr.default) {
        err('Invalid arguments for $switch operator');
      } else {
        return computeValue(obj, expr.default, null);
      }
    },


    /**
     * Evaluates an expression and returns the first expression if it evaluates to a non-null value.
     * Otherwise, $ifNull returns the second expression's value.
     *
     * @param obj
     * @param expr
     * @returns {*}
     */
    $ifNull: function $ifNull(obj, expr) {
      assert(isArray(expr) && expr.length === 2, 'Invalid arguments for $ifNull operator');
      var args = computeValue(obj, expr, null);
      return args[0] === null || args[0] === undefined ? args[1] : args[0];
    }
  };

  // used for formatting dates in $dateToString operator
  var DATE_SYM_TABLE = {
    '%Y': ['$year', 4],
    '%m': ['$month', 2],
    '%d': ['$dayOfMonth', 2],
    '%H': ['$hour', 2],
    '%M': ['$minute', 2],
    '%S': ['$second', 2],
    '%L': ['$millisecond', 3],
    '%j': ['$dayOfYear', 3],
    '%w': ['$dayOfWeek', 1],
    '%U': ['$week', 2],
    '%%': '%'
  };

  var dateOperators = {
    /**
     * Returns the day of the year for a date as a number between 1 and 366 (leap year).
     * @param obj
     * @param expr
     */
    $dayOfYear: function $dayOfYear(obj, expr) {
      var d = computeValue(obj, expr, null);
      if (isDate(d)) {
        var start = new Date(d.getFullYear(), 0, 0);
        var diff = d - start;
        var oneDay = 1000 * 60 * 60 * 24;
        return Math.round(diff / oneDay);
      }
      return undefined;
    },


    /**
     * Returns the day of the month for a date as a number between 1 and 31.
     * @param obj
     * @param expr
     */
    $dayOfMonth: function $dayOfMonth(obj, expr) {
      var d = computeValue(obj, expr, null);
      return isDate(d) ? d.getDate() : undefined;
    },


    /**
     * Returns the day of the week for a date as a number between 1 (Sunday) and 7 (Saturday).
     * @param obj
     * @param expr
     */
    $dayOfWeek: function $dayOfWeek(obj, expr) {
      var d = computeValue(obj, expr, null);
      return isDate(d) ? d.getDay() + 1 : undefined;
    },


    /**
     * Returns the year for a date as a number (e.g. 2014).
     * @param obj
     * @param expr
     */
    $year: function $year(obj, expr) {
      var d = computeValue(obj, expr, null);
      return isDate(d) ? d.getFullYear() : undefined;
    },


    /**
     * Returns the month for a date as a number between 1 (January) and 12 (December).
     * @param obj
     * @param expr
     */
    $month: function $month(obj, expr) {
      var d = computeValue(obj, expr, null);
      return isDate(d) ? d.getMonth() + 1 : undefined;
    },


    /**
     * Returns the week number for a date as a number between 0
     * (the partial week that precedes the first Sunday of the year) and 53 (leap year).
     * @param obj
     * @param expr
     */
    $week: function $week(obj, expr) {
      // source: http://stackoverflow.com/a/6117889/1370481
      var d = computeValue(obj, expr, null);

      // Copy date so don't modify original
      d = new Date(+d);
      d.setHours(0, 0, 0);
      // Set to nearest Thursday: current date + 4 - current day number
      // Make Sunday's day number 7
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      // Get first day of year
      var yearStart = new Date(d.getFullYear(), 0, 1);
      // Calculate full weeks to nearest Thursday
      return Math.floor(((d - yearStart) / 8.64e7 + 1) / 7);
    },


    /**
     * Returns the hour for a date as a number between 0 and 23.
     * @param obj
     * @param expr
     */
    $hour: function $hour(obj, expr) {
      var d = computeValue(obj, expr, null);
      return isDate(d) ? d.getUTCHours() : undefined;
    },


    /**
     * Returns the minute for a date as a number between 0 and 59.
     * @param obj
     * @param expr
     */
    $minute: function $minute(obj, expr) {
      var d = computeValue(obj, expr, null);
      return isDate(d) ? d.getMinutes() : undefined;
    },


    /**
     * Returns the seconds for a date as a number between 0 and 60 (leap seconds).
     * @param obj
     * @param expr
     */
    $second: function $second(obj, expr) {
      var d = computeValue(obj, expr, null);
      return isDate(d) ? d.getSeconds() : undefined;
    },


    /**
     * Returns the milliseconds of a date as a number between 0 and 999.
     * @param obj
     * @param expr
     */
    $millisecond: function $millisecond(obj, expr) {
      var d = computeValue(obj, expr, null);
      return isDate(d) ? d.getMilliseconds() : undefined;
    },


    /**
     * Returns the date as a formatted string.
     *
     * %Y  Year (4 digits, zero padded)  0000-9999
     * %m  Month (2 digits, zero padded)  01-12
     * %d  Day of Month (2 digits, zero padded)  01-31
     * %H  Hour (2 digits, zero padded, 24-hour clock)  00-23
     * %M  Minute (2 digits, zero padded)  00-59
     * %S  Second (2 digits, zero padded)  00-60
     * %L  Millisecond (3 digits, zero padded)  000-999
     * %j  Day of year (3 digits, zero padded)  001-366
     * %w  Day of week (1-Sunday, 7-Saturday)  1-7
     * %U  Week of year (2 digits, zero padded)  00-53
     * %%  Percent Character as a Literal  %
     *
     * @param obj current object
     * @param expr operator expression
     */
    $dateToString: function $dateToString(obj, expr) {
      var fmt = expr['format'];
      var date = computeValue(obj, expr['date'], null);
      var matches = fmt.match(/(%%|%Y|%m|%d|%H|%M|%S|%L|%j|%w|%U)/g);

      for (var i = 0, len = matches.length; i < len; i++) {
        var hdlr = DATE_SYM_TABLE[matches[i]];
        var value = hdlr;

        if (isArray(hdlr)) {
          // reuse date operators
          var fn = this[hdlr[0]];
          var pad = hdlr[1];
          value = padDigits(fn.call(this, obj, date), pad);
        }
        // replace the match with resolved value
        fmt = fmt.replace(matches[i], value);
      }

      return fmt;
    }
  };

  function padDigits(number, digits) {
    return new Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
  }

  var literalOperators = {
    /**
     * Return a value without parsing.
     * @param obj
     * @param expr
     */
    $literal: function $literal(obj, expr) {
      return expr;
    }
  };

  var setOperators = {
    /**
     * Returns true if two sets have the same elements.
     * @param obj
     * @param expr
     */
    $setEquals: function $setEquals(obj, expr) {
      var args = computeValue(obj, expr, null);
      var xs = unique(args[0]);
      var ys = unique(args[1]);
      return xs.length === ys.length && xs.length === intersection(xs, ys).length;
    },


    /**
     * Returns the common elements of the input sets.
     * @param obj
     * @param expr
     */
    $setIntersection: function $setIntersection(obj, expr) {
      var args = computeValue(obj, expr, null);
      return intersection(args[0], args[1]);
    },


    /**
     * Returns elements of a set that do not appear in a second set.
     * @param obj
     * @param expr
     */
    $setDifference: function $setDifference(obj, expr) {
      var args = computeValue(obj, expr, null);
      return args[0].filter(notInArray.bind(null, args[1]));
    },


    /**
     * Returns a set that holds all elements of the input sets.
     * @param obj
     * @param expr
     */
    $setUnion: function $setUnion(obj, expr) {
      var args = computeValue(obj, expr, null);
      return union(args[0], args[1]);
    },


    /**
     * Returns true if all elements of a set appear in a second set.
     * @param obj
     * @param expr
     */
    $setIsSubset: function $setIsSubset(obj, expr) {
      var args = computeValue(obj, expr, null);
      return intersection(args[0], args[1]).length === args[0].length;
    },


    /**
     * Returns true if any elements of a set evaluate to true, and false otherwise.
     * @param obj
     * @param expr
     */
    $anyElementTrue: function $anyElementTrue(obj, expr) {
      // mongodb nests the array expression in another
      var args = computeValue(obj, expr, null)[0];
      return args.some(truthy);
    },


    /**
     * Returns true if all elements of a set evaluate to true, and false otherwise.
     * @param obj
     * @param expr
     */
    $allElementsTrue: function $allElementsTrue(obj, expr) {
      // mongodb nests the array expression in another
      var args = computeValue(obj, expr, null)[0];
      return args.every(truthy);
    }
  };

  var stringOperators = {

    /**
     * Concatenates two strings.
     *
     * @param obj
     * @param expr
     * @returns {string|*}
     */
    $concat: function $concat(obj, expr) {
      var args = computeValue(obj, expr, null);
      // does not allow concatenation with nulls
      if ([null, undefined].some(inArray.bind(null, args))) {
        return null;
      }
      return args.join('');
    },


    /**
     * Searches a string for an occurence of a substring and returns the UTF-8 code point index of the first occurence.
     * If the substring is not found, returns -1.
     *
     * @param  {Object} obj
     * @param  {*} expr
     * @return {*}
     */
    $indexOfBytes: function $indexOfBytes(obj, expr) {
      var arr = computeValue(obj, expr, null);

      if (isNil(arr[0])) return null;

      assert(isString(arr[0]), '$indexOfBytes first operand must resolve to a string');
      assert(isString(arr[1]), '$indexOfBytes second operand must resolve to a string');

      var str = arr[0];
      var searchStr = arr[1];
      var start = arr[2];
      var end = arr[3];

      assert(isNil(start) || isNumber(start) && start >= 0 && Math.round(start) === start, '$indexOfBytes third operand must resolve to a non-negative integer');
      start = start || 0;

      assert(isNil(end) || isNumber(end) && end >= 0 && Math.round(end) === end, '$indexOfBytes fourth operand must resolve to a non-negative integer');
      end = end || str.length;

      if (start > end) return -1;

      var index = str.substring(start, end).indexOf(searchStr);
      return index > -1 ? index + start : index;
    },


    /**
     * Splits a string into substrings based on a delimiter.
     * If the delimiter is not found within the string, returns an array containing the original string.
     *
     * @param  {Object} obj
     * @param  {Array} expr
     * @return {Array} Returns an array of substrings.
     */
    $split: function $split(obj, expr) {
      var args = computeValue(obj, expr, null);
      assert(isString(args[0]), '$split requires an expression that evaluates to a string as a first argument, found: ' + getType(args[0]));
      assert(isString(args[1]), '$split requires an expression that evaluates to a string as a second argument, found: ' + getType(args[1]));
      return args[0].split(args[1]);
    },


    /**
     * Compares two strings and returns an integer that reflects the comparison.
     *
     * @param obj
     * @param expr
     * @returns {number}
     */
    $strcasecmp: function $strcasecmp(obj, expr) {
      var args = computeValue(obj, expr, null);
      args[0] = isEmpty(args[0]) ? '' : args[0].toUpperCase();
      args[1] = isEmpty(args[1]) ? '' : args[1].toUpperCase();
      if (args[0] > args[1]) {
        return 1;
      }
      return args[0] < args[1] ? -1 : 0;
    },


    /**
     * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
     * The index is zero-based.
     *
     * @param obj
     * @param expr
     * @returns {string}
     */
    $substr: function $substr(obj, expr) {
      var args = computeValue(obj, expr, null);
      if (isString(args[0])) {
        if (args[1] < 0) {
          return '';
        } else if (args[2] < 0) {
          return args[0].substr(args[1]);
        } else {
          return args[0].substr(args[1], args[2]);
        }
      }
      return '';
    },


    /**
     * Converts a string to lowercase.
     *
     * @param obj
     * @param expr
     * @returns {string}
     */
    $toLower: function $toLower(obj, expr) {
      var value = computeValue(obj, expr, null);
      return isEmpty(value) ? '' : value.toLowerCase();
    },


    /**
     * Converts a string to uppercase.
     *
     * @param obj
     * @param expr
     * @returns {string}
     */
    $toUpper: function $toUpper(obj, expr) {
      var value = computeValue(obj, expr, null);
      return isEmpty(value) ? '' : value.toUpperCase();
    }
  };

  /**
   * Aggregation framework variable operators
   */

  var variableOperators = {
    /**
     * Applies a sub-expression to each element of an array and returns the array of resulting values in order.
     *
     * @param obj
     * @param expr
     * @returns {Array|*}
     */
    $map: function $map(obj, expr) {
      var inputExpr = computeValue(obj, expr['input'], null);
      assert(isArray(inputExpr), 'Input expression for $map must resolve to an array');

      var asExpr = expr['as'];
      var inExpr = expr['in'];

      // HACK: add the "as" expression as a value on the object to take advantage of "resolve()"
      // which will reduce to that value when invoked. The reference to the as expression will be prefixed with "$$".
      // But since a "$" is stripped of before passing the name to "resolve()" we just need to prepend "$" to the key.
      var tempKey = '$' + asExpr;
      // let's save any value that existed, kinda useless but YOU CAN NEVER BE TOO SURE, CAN YOU :)
      var original = obj[tempKey];
      return inputExpr.map(function (item) {
        obj[tempKey] = item;
        var value = computeValue(obj, inExpr, null);
        // cleanup and restore
        if (isUndefined(original)) {
          delete obj[tempKey];
        } else {
          obj[tempKey] = original;
        }
        return value;
      });
    },


    /**
     * Defines variables for use within the scope of a sub-expression and returns the result of the sub-expression.
     *
     * @param obj
     * @param expr
     * @returns {*}
     */
    $let: function $let(obj, expr) {
      var varsExpr = expr['vars'];
      var inExpr = expr['in'];

      // resolve vars
      var originals = {};
      var varsKeys = keys(varsExpr);
      each(varsKeys, function (key) {
        var val = computeValue(obj, varsExpr[key], null);
        var tempKey = '$' + key;
        // set value on object using same technique as in "$map"
        originals[tempKey] = obj[tempKey];
        obj[tempKey] = val;
      });

      var value = computeValue(obj, inExpr, null);

      // cleanup and restore
      each(varsKeys, function (key) {
        var tempKey = '$' + key;
        if (isUndefined(originals[tempKey])) {
          delete obj[tempKey];
        } else {
          obj[tempKey] = originals[tempKey];
        }
      });

      return value;
    }
  };

  // combine aggregate operators
  var aggregateOperators = Object.assign({}, arithmeticOperators, arrayOperators, booleanOperators, comparisonOperators, conditionalOperators, dateOperators, literalOperators, setOperators, stringOperators, variableOperators);

  /**
   * Aggregator for defining filter using mongoDB aggregation pipeline syntax
   *
   * @param operators an Array of pipeline operators
   * @constructor
   */

  var Aggregator = function () {
    function Aggregator(operators) {
      _classCallCheck(this, Aggregator);

      this.__operators = operators;
    }

    /**
     * Apply the pipeline operations over the collection by order of the sequence added
     *
     * @param collection an array of objects to process
     * @param query the `Query` object to use as context
     * @returns {Array}
     */


    _createClass(Aggregator, [{
      key: 'run',
      value: function run(collection, query) {
        if (!isEmpty(this.__operators)) {
          // run aggregation pipeline
          each(this.__operators, function (operator) {
            var key = keys(operator);
            if (key.length === 1 && inArray(ops(OP_PIPELINE), key[0])) {
              key = key[0];
              if (query instanceof Query) {
                collection = pipelineOperators[key].call(query, collection, operator[key]);
              } else {
                collection = pipelineOperators[key](collection, operator[key]);
              }
            } else {
              err("Invalid aggregation operator '" + key + "'");
            }
          });
        }
        return collection;
      }
    }]);

    return Aggregator;
  }();

  /**
   * Return the result collection after running the aggregation pipeline for the given collection
   *
   * @param collection
   * @param pipeline
   * @returns {Array}
   */


  function _aggregate(collection, pipeline) {
    assert(isArray(pipeline), 'Aggregation pipeline must be an array');
    return new Aggregator(pipeline).run(collection);
  }

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
    $: function $(obj, expr, field) {
      err('$ not implemented');
    },


    /**
     * Projects only the first element from an array that matches the specified $elemMatch condition.
     *
     * @param obj
     * @param field
     * @param expr
     * @returns {*}
     */
    $elemMatch: function $elemMatch(obj, expr, field) {
      var array$$1 = resolve(obj, field);
      var query = new Query(expr);

      if (isNil(array$$1) || !isArray(array$$1)) {
        return undefined;
      }

      for (var i = 0; i < array$$1.length; i++) {
        if (query.test(array$$1[i])) {
          return [array$$1[i]];
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
    $slice: function $slice(obj, expr, field) {
      var xs = resolve(obj, field);

      if (!isArray(xs)) return xs;

      if (isArray(expr)) {
        return slice(xs, expr[0], expr[1]);
      } else if (isNumber(expr)) {
        return slice(xs, expr);
      } else {
        err('Invalid argument type for $slice projection operator');
      }
    },


    /**
     * Returns the population standard deviation of the input values.
     * @param  {Object} obj
     * @param  {Object} expr
     * @param  {String} field
     * @return {Number}
     */
    $stdDevPop: function $stdDevPop(obj, expr, field) {
      return stddev({
        data: computeValue(obj, expr, field),
        sampled: false
      });
    },


    /**
     * Returns the sample standard deviation of the input values.
     * @param  {Object} obj
     * @param  {Object} expr
     * @param  {String} field
     * @return {Number|null}
     */
    $stdDevSamp: function $stdDevSamp(obj, expr, field) {
      return stddev({
        data: computeValue(obj, expr, field),
        sampled: true
      });
    }
  };

  /**
   * Pipeline Aggregation Stages. https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/
   */
  var pipelineOperators = {

    /**
     * Adds new fields to documents.
     * Outputs documents that contain all existing fields from the input documents and newly added fields.
     *
     * @param {Array} collection
     * @param {*} expr
     */
    $addFields: function $addFields(collection, expr) {
      var newFields = keys(expr);

      return collection.map(function (obj) {
        obj = clone(obj);

        each(newFields, function (selector) {
          var subExpr = expr[selector];
          var newValue = void 0;

          if (isObject(subExpr)) {
            var subKeys = keys(subExpr);

            // check for any operators first
            var operator = subKeys.filter(function (k) {
              return k.indexOf('$') === 0;
            });

            if (!isEmpty(operator)) {
              assert(subKeys.length === 1, 'Can have only one root operator in $addFields');
              operator = operator[0];
              subExpr = subExpr[operator];
              newValue = computeValue(obj, subExpr, operator);
            }
          } else {
            newValue = computeValue(obj, subExpr, null);
          }

          traverse(obj, selector, function (o, key) {
            o[key] = newValue;
          }, true);
        });

        return obj;
      });
    },


    /**
     * Groups documents together for the purpose of calculating aggregate values based on a collection of documents.
     *
     * @param collection
     * @param expr
     * @returns {Array}
     */
    $group: function $group(collection, expr) {
      // lookup key for grouping
      var objectId = expr[idKey()];

      var partitions = groupBy(collection, function (obj) {
        return computeValue(obj, objectId, objectId);
      });

      var result = [];

      // remove the group key
      delete expr[idKey()];

      each(partitions.keys, function (value, i) {
        var obj = {};

        // exclude undefined key value
        if (!isUndefined(value)) {
          obj[idKey()] = value;
        }

        // compute remaining keys in expression
        each(expr, function (val, key) {
          obj[key] = accumulate(partitions.groups[i], key, val);
        });
        result.push(obj);
      });

      return result;
    },


    /**
     * Performs a left outer join to another collection in the same database to filter in documents from the “joined” collection for processing.
     *
     * @param collection
     * @param expr
     */
    $lookup: function $lookup(collection, expr) {
      var joinColl = expr.from;
      var localField = expr.localField;
      var foreignField = expr.foreignField;
      var asField = expr.as;

      var errorMsg = "Invalid $lookup expression. ";
      assert(isArray(joinColl), errorMsg + "'from' must be an array");
      assert(isString(foreignField), errorMsg + "'foreignField' must be a string");
      assert(isString(localField), errorMsg + "'localField' must be a string");
      assert(isString(asField), errorMsg + "'as' must be a string");

      var result = [];
      var hash = {};

      function hashCode(v) {
        return getHash(isNil(v) ? null : v);
      }

      if (joinColl.length <= collection.length) {
        each(joinColl, function (obj, i) {
          var k = hashCode(obj[foreignField]);
          hash[k] = hash[k] || [];
          hash[k].push(i);
        });

        each(collection, function (obj) {
          var k = hashCode(obj[localField]);
          var indexes = hash[k] || [];
          var newObj = clone(obj);
          newObj[asField] = indexes.map(function (i) {
            return clone(joinColl[i]);
          });
          result.push(newObj);
        });
      } else {

        each(collection, function (obj, i) {
          var k = hashCode(obj[localField]);
          hash[k] = hash[k] || [];
          hash[k].push(i);
        });

        var tempResult = {};
        each(joinColl, function (obj) {
          var k = hashCode(obj[foreignField]);
          var indexes = hash[k] || [];
          each(indexes, function (i) {
            var newObj = tempResult[i] || clone(collection[i]);
            newObj[asField] = newObj[asField] || [];
            newObj[asField].push(clone(obj));
            tempResult[i] = newObj;
          });
        });
        for (var i = 0, len = keys(tempResult).length; i < len; i++) {
          result.push(tempResult[i]);
        }
      }

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
    $match: function $match(collection, expr) {
      return new Query(expr).find(collection).all();
    },


    /**
     * Reshapes a document stream.
     * $project can rename, add, or remove fields as well as create computed values and sub-documents.
     *
     * @param collection
     * @param expr
     * @returns {Array}
     */
    $project: function $project(collection, expr) {
      if (isEmpty(expr)) {
        return collection;
      }

      // result collection
      var projected = [];
      var objKeys = keys(expr);
      var idOnlyExcludedExpression = false;
      var ID_KEY = idKey();

      // validate inclusion and exclusion
      var check = [false, false];
      each(expr, function (v, k) {
        if (k === ID_KEY) return;
        if (v === 0 || v === false) {
          check[0] = true;
        } else {
          check[1] = true;
        }
        assert(check[0] !== check[1], 'Projection cannot have a mix of inclusion and exclusion.');
      });

      if (inArray(objKeys, ID_KEY)) {
        var id = expr[ID_KEY];
        if (id === 0 || id === false) {
          objKeys = objKeys.filter(notInArray.bind(null, [ID_KEY]));
          assert(notInArray(objKeys, ID_KEY), 'Must not contain collections id key');
          idOnlyExcludedExpression = isEmpty(objKeys);
        }
      } else {
        // if not specified the add the ID field
        objKeys.push(ID_KEY);
      }

      each(collection, function (obj) {
        var cloneObj = {};
        var foundSlice = false;
        var foundExclusion = false;
        var dropKeys = [];

        if (idOnlyExcludedExpression) {
          dropKeys.push(ID_KEY);
        }

        each(objKeys, function (key) {
          var subExpr = expr[key];
          var value = void 0; // final computed value of the key

          if (key !== ID_KEY && subExpr === 0) {
            foundExclusion = true;
          }

          if (key === ID_KEY && isEmpty(subExpr)) {
            // tiny optimization here to skip over id
            value = obj[key];
          } else if (isString(subExpr)) {
            value = computeValue(obj, subExpr, key);
          } else if (subExpr === 1 || subExpr === true) {
            // For direct projections, we use the resolved object value
          } else if (isObject(subExpr)) {
            var operator = keys(subExpr);
            operator = operator.length > 1 ? false : operator[0];

            if (inArray(ops(OP_PROJECTION), operator)) {
              // apply the projection operator on the operator expression for the key
              if (operator === '$slice') {
                // $slice is handled differently for aggregation and projection operations
                if (array(subExpr[operator]).every(isNumber)) {
                  // $slice for projection operation
                  value = projectionOperators[operator](obj, subExpr[operator], key);
                  foundSlice = true;
                } else {
                  // $slice for aggregation operation
                  value = computeValue(obj, subExpr, key);
                }
              } else {
                value = projectionOperators[operator](obj, subExpr[operator], key);
              }
            } else {
              // compute the value for the sub expression for the key
              value = computeValue(obj, subExpr, key);
            }
          } else {
            dropKeys.push(key);
            return;
          }

          // clone resolved values
          var objValue = clone(resolveObj(obj, key));

          if (!isUndefined(objValue)) {
            Object.assign(cloneObj, objValue);
          }
          if (!isUndefined(value)) {
            setValue(cloneObj, key, clone(value));
          }
        });
        // if projection included $slice operator
        // Also if exclusion fields are found or we want to exclude only the id field
        // include keys that were not explicitly excluded
        if (foundSlice || foundExclusion || idOnlyExcludedExpression) {
          cloneObj = Object.assign(clone(obj), cloneObj);
          each(dropKeys, function (key) {
            return removeValue(cloneObj, key);
          });
        }
        projected.push(cloneObj);
      });

      return projected;
    },


    /**
     * Restricts the number of documents in an aggregation pipeline.
     *
     * @param collection
     * @param value
     * @returns {Object|*}
     */
    $limit: function $limit(collection, value) {
      return collection.slice(0, value);
    },


    /**
     * Skips over a specified number of documents from the pipeline and returns the rest.
     *
     * @param collection
     * @param value
     * @returns {*}
     */
    $skip: function $skip(collection, value) {
      return collection.slice(value);
    },


    /**
     * Takes an array of documents and returns them as a stream of documents.
     *
     * @param collection
     * @param expr
     * @returns {Array}
     */
    $unwind: function $unwind(collection, expr) {
      var result = [];
      var field = expr.substr(1);
      each(collection, function (obj) {
        // must throw an error if value is not an array
        var value = getValue(obj, field);

        assert(isArray(value), "Target field '" + field + "' is not of type Array.");

        each(value, function (item) {
          var tmp = clone(obj);
          tmp[field] = item;
          result.push(tmp);
        });
      });
      return result;
    },


    /**
     * Takes all input documents and returns them in a stream of sorted documents.
     *
     * @param collection
     * @param sortKeys
     * @returns {*}
     */
    $sort: function $sort(collection, sortKeys) {
      if (!isEmpty(sortKeys) && isObject(sortKeys)) {
        var modifiers = keys(sortKeys);
        each(modifiers.reverse(), function (key) {
          var grouped = groupBy(collection, function (obj) {
            return resolve(obj, key);
          });
          var sortedIndex = {};
          var getIndex = function getIndex(k) {
            return sortedIndex[getHash(k)];
          };

          var indexKeys = sortBy(grouped.keys, function (item, i) {
            sortedIndex[getHash(item)] = i;
            return item;
          });

          if (sortKeys[key] === -1) {
            indexKeys.reverse();
          }
          collection = [];
          each(indexKeys, function (item) {
            return into(collection, grouped.groups[getIndex(item)]);
          });
        });
      }
      return collection;
    },


    /**
     * Groups incoming documents based on the value of a specified expression,
     * then computes the count of documents in each distinct group.
     *
     * https://docs.mongodb.com/manual/reference/operator/aggregation/sortByCount/
     *
     * @param  {Array} collection
     * @param  {Object} expr
     * @return {*}
     */
    $sortByCount: function $sortByCount(collection, expr) {
      var newExpr = { count: { $sum: 1 } };
      newExpr[idKey()] = expr;

      return this.$sort(this.$group(collection, newExpr), { count: -1 });
    },


    /**
     * Randomly selects the specified number of documents from its input.
     * https://docs.mongodb.com/manual/reference/operator/aggregation/sample/
     *
     * @param  {Array} collection
     * @param  {Object} expr
     * @return {*}
     */
    $sample: function $sample(collection, expr) {
      var size = expr['size'];
      assert(isNumber(size), '$sample size must be a positive integer');

      var result = [];
      var len = collection.length;
      for (var i = 0; i < size; i++) {
        var n = Math.floor(Math.random() * len);
        result.push(collection[n]);
      }
      return result;
    },


    /**
     * Returns a document that contains a count of the number of documents input to the stage.
     * @param  {Array} collection
     * @param  {String} expr
     * @return {Object}
     */
    $count: function $count(collection, expr) {
      assert(isString(expr) && expr.trim() !== '' && expr.indexOf('.') === -1 && expr.trim()[0] !== '$', 'Invalid expression value for $count');

      var result = {};
      result[expr] = collection.length;
      return result;
    },


    /**
     * Replaces a document with the specified embedded document or new one.
     * The replacement document can be any valid expression that resolves to a document.
     *
     * https://docs.mongodb.com/manual/reference/operator/aggregation/replaceRoot/
     *
     * @param  {Array} collection
     * @param  {Object} expr
     * @return {*}
     */
    $replaceRoot: function $replaceRoot(collection, expr) {
      var newRoot = expr['newRoot'];
      var result = [];
      each(collection, function (obj) {
        obj = computeValue(obj, newRoot, null);
        assert(isObject(obj), '$replaceRoot expression must return a valid JS object');
        result.push(obj);
      });
      return result;
    },


    /**
     * Restricts the contents of the documents based on information stored in the documents themselves.
     *
     * https://docs.mongodb.com/manual/reference/operator/aggregation/redact/
     */
    $redact: function $redact(collection, expr) {
      return collection.map(function (obj) {
        return redactObj(clone(obj), expr);
      });
    },


    /**
     * Categorizes incoming documents into groups, called buckets, based on a specified expression and bucket boundaries.
     *
     * https://docs.mongodb.com/manual/reference/operator/aggregation/bucket/
     */
    $bucket: function $bucket(collection, expr) {
      var boundaries = expr.boundaries;
      var defaultKey = expr.default;
      var lower = boundaries[0]; // inclusive
      var upper = boundaries[boundaries.length - 1]; // exclusive
      var outputExpr = expr.output || { 'count': { '$sum': 1 } };

      assert(boundaries.length > 2, "$bucket 'boundaries' expression must have at least 3 elements");
      var boundType = getType(lower);

      for (var i = 0, len = boundaries.length - 1; i < len; i++) {
        assert(boundType === getType(boundaries[i + 1]), "$bucket 'boundaries' must all be of the same type");
        assert(boundaries[i] < boundaries[i + 1], "$bucket 'boundaries' must be sorted in ascending order");
      }

      if (!isNil(defaultKey) && getType(expr.default) === getType(lower)) {
        assert(lower > expr.default || upper < expr.default, "$bucket 'default' expression must be out of boundaries range");
      }

      var grouped = {};
      each(boundaries, function (k) {
        return grouped[k] = [];
      });

      // add default key if provided
      if (!isNil(defaultKey)) grouped[defaultKey] = [];

      each(collection, function (obj) {
        var key = computeValue(obj, expr.groupBy, null);

        if (isNil(key) || key < lower || key >= upper) {
          assert(!isNil(defaultKey), '$bucket require a default for out of range values');
          grouped[defaultKey].push(obj);
        } else if (key >= lower && key < upper) {
          var index = findInsertIndex(boundaries, key);
          var boundKey = boundaries[Math.max(0, index - 1)];
          grouped[boundKey].push(obj);
        } else {
          err("$bucket 'groupBy' expression must resolve to a value in range of boundaries");
        }
      });

      // upper bound is exclusive so we remove it
      boundaries.pop();
      if (!isNil(defaultKey)) boundaries.push(defaultKey);

      return map(boundaries, function (key) {
        var acc = accumulate(grouped[key], null, outputExpr);
        return Object.assign(acc, { '_id': key });
      });
    },
    $bucketAuto: function $bucketAuto(collection, expr) {
      var outputExpr = expr.output || { 'count': { '$sum': 1 } };
      var groupByExpr = expr.groupBy;
      var granularity = expr.granularity;
      var bucketCount = expr.buckets;

      assert(bucketCount > 0, "The $bucketAuto 'buckets' field must be greater than 0, but found: " + bucketCount);

      var approxBucketSize = Math.round(collection.length / bucketCount);
      if (approxBucketSize < 1) {
        approxBucketSize = 1;
      }

      var computeValueOptimized = memoize(computeValue);
      var grouped = {};
      var remaining = [];
      var sorted = sortBy(collection, function (o) {
        var key = computeValueOptimized(o, groupByExpr, null);
        if (isNil(key)) {
          remaining.push(o);
        } else {
          grouped[key] || (grouped[key] = []);
          grouped[key].push(o);
        }
        return key;
      });

      var result = [];
      var index = 0; // counter for sorted collection

      for (var i = 0, len = sorted.length; i < bucketCount && index < len; i++) {
        var boundaries = {};
        var bucketItems = [];

        for (var j = 0; j < approxBucketSize && index < len; j++) {
          var key = computeValueOptimized(sorted[index], groupByExpr, null);

          if (isNil(key)) key = null;

          // populate current bucket with all values for current key
          into(bucketItems, isNil(key) ? remaining : grouped[key]);

          // increase sort index by number of items added
          index += isNil(key) ? remaining.length : grouped[key].length;

          // set the min key boundary if not already present
          if (!has(boundaries, 'min')) boundaries['min'] = key;

          if (result.length > 0) {
            var lastBucket = result[result.length - 1];
            lastBucket['_id']['max'] = boundaries['min'];
          }
        }

        // if is last bucket add remaining items
        if (i == bucketCount - 1) {
          into(bucketItems, sorted.slice(index));
        }

        result.push(Object.assign(accumulate(bucketItems, null, outputExpr), { '_id': boundaries }));
      }

      if (result.length > 0) {
        result[result.length - 1]['_id']['max'] = computeValueOptimized(sorted[sorted.length - 1], groupByExpr, null);
      }

      return result;
    },


    /**
     * Processes multiple aggregation pipelines within a single stage on the same set of input documents.
     * Enables the creation of multi-faceted aggregations capable of characterizing data across multiple dimensions, or facets, in a single stage.
     */
    $facet: function $facet(collection, expr) {
      return map(expr, function (pipeline) {
        return _aggregate(collection, pipeline);
      });
    }
  };

  /**
   * Returns the result of evaluating a $group operation over a collection
   *
   * @param collection
   * @param field the name of the aggregate operator or field
   * @param expr the expression of the aggregate operator for the field
   * @returns {*}
   */
  function accumulate(collection, field, expr) {
    if (inArray(ops(OP_GROUP), field)) {
      return groupOperators[field](collection, expr);
    }

    if (isObject(expr)) {
      var result = {};
      each(expr, function (val, key, _, halt) {
        result[key] = accumulate(collection, key, expr[key]);
        // must run ONLY one group operator per expression
        // if so, return result of the computed value
        if (inArray(ops(OP_GROUP), key)) {
          result = result[key];
          // if there are more keys in expression this is bad
          assert(keys(expr).length === 1, "Invalid $group expression '" + JSON.stringify(expr) + "'");
          halt(); // break
        }
      });
      return result;
    }

    return undefined;
  }

  // operator definitions
  var OPERATORS = {
    'aggregate': aggregateOperators,
    'group': groupOperators,
    'pipeline': pipelineOperators,
    'projection': projectionOperators,
    'query': queryOperators
  };

  /**
   * Keys specifying different operator classes
   */
  var OP_AGGREGATE = 'aggregate';
  var OP_GROUP = 'group';
  var OP_PIPELINE = 'pipeline';
  var OP_PROJECTION = 'projection';
  var OP_QUERY = 'query';

  /**
   * Returns the operators defined for the given operator key
   *
   * @param {String} opClass The operator class to query. See `Mingo.OP_$XXX` members
   */
  function ops(opClass) {
    return keys(OPERATORS[opClass]);
  }

  /**
   * Add new operators
   *
   * @param opClass the operator class to extend
   * @param fn a function returning an object of new operators
   */
  function addOperators(opClass, fn) {

    var newOperators = fn(_internal());

    // ensure correct type specified
    assert(has(OPERATORS, opClass), "Could not identify operator class '" + opClass + "'");

    var operators = OPERATORS[opClass];

    // check for existing operators
    each(newOperators, function (fn, op) {
      assert(/^\$\w+$/.test(op), "Invalid operator name '" + op + "'");
      assert(!has(operators, op), 'Operator ' + op + ' is already defined for ' + opClass + ' operators');
    });

    var wrapped = {};

    switch (opClass) {
      case OP_QUERY:
        each(newOperators, function (fn, op) {
          wrapped[op] = function (f, ctx) {
            return function (selector, value) {
              return {
                test: function test(obj) {
                  // value of field must be fully resolved.
                  var lhs = resolve(obj, selector);
                  var result = f.call(ctx, selector, lhs, value);
                  if (isBoolean(result)) {
                    return result;
                  } else if (result instanceof Query) {
                    return result.test(obj);
                  } else {
                    err("Invalid return type for '" + op + "'. Must return a Boolean or Query");
                  }
                }
              };
            };
          }(fn, newOperators);
        });
        break;
      case OP_PROJECTION:
        each(newOperators, function (fn, op) {
          wrapped[op] = function (f, ctx) {
            return function (obj, expr, selector) {
              var lhs = resolve(obj, selector);
              return f.call(ctx, selector, lhs, expr);
            };
          }(fn, newOperators);
        });
        break;
      default:
        each(newOperators, function (fn, op) {
          wrapped[op] = function (f, ctx) {
            return function () {
              for (var _len3 = arguments.length, args = Array(_len3), _key2 = 0; _key2 < _len3; _key2++) {
                args[_key2] = arguments[_key2];
              }

              return f.apply(ctx, args);
            };
          }(fn, newOperators);
        });
    }

    // toss the operator salad :)
    Object.assign(OPERATORS[opClass], wrapped);
  }

  /**
   * Internal functions
   */

  // Settings used by Mingo internally
  var settings = {
    key: '_id'
  };

  /**
   * Setup default settings for Mingo
   * @param options
   */

  /**
   * Implementation of system variables
   * @type {Object}
   */
  var systemVariables = {
    '$$ROOT': function $$ROOT(obj, expr, opt) {
      return opt.root;
    },
    '$$CURRENT': function $$CURRENT(obj, expr, opt) {
      return obj;
    }
  };

  /**
   * Implementation of $redact variables
   *
   * Each function accepts 3 arguments (obj, expr, opt)
   *
   * @type {Object}
   */
  var redactVariables = {
    '$$KEEP': function $$KEEP(obj) {
      return obj;
    },
    '$$PRUNE': function $$PRUNE() {
      return undefined;
    },
    '$$DESCEND': function $$DESCEND(obj, expr, opt) {
      // traverse nested documents iff there is a $cond
      if (!has(expr, '$cond')) return obj;

      var result = void 0;

      each(obj, function (current, key) {
        if (isObjectLike(current)) {
          if (isArray(current)) {
            result = [];
            each(current, function (elem) {
              if (isObject(elem)) {
                elem = redactObj(elem, expr, opt);
              }
              if (!isNil(elem)) result.push(elem);
            });
          } else {
            result = redactObj(current, expr, opt);
          }

          if (isNil(result)) {
            delete obj[key]; // pruned result
          } else {
            obj[key] = result;
          }
        }
      });
      return obj;
    }
  };

  // system variables
  var SYS_VARS = keys(systemVariables);
  var REDACT_VARS = keys(redactVariables);

  /**
   * Returns the key used as the collection's objects ids
   */
  function idKey() {
    return settings.key;
  }

  /**
   * Retrieve the value of a given key on an object
   * @param obj
   * @param field
   * @returns {*}
   * @private
   */
  function getValue(obj, field) {
    return obj[field];
  }

  /**
   * Resolve the value of the field (dot separated) on the given object
   * @param obj {Object} the object context
   * @param selector {String} dot separated path to field
   * @param deepFlag {Boolean} flag whether to iterate deeply (default: false)
   * @returns {*}
   */
  function resolve(obj, selector) {
    var deepFlag = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    var names = selector.split('.');
    var value = obj;

    var _loop2 = function _loop2(i) {
      var isText = names[i].match(/^\d+$/) === null;

      if (isText && isArray(value)) {
        // On the first iteration, we check if we received a stop flag.
        // If so, we stop to prevent iterating over a nested array value
        // on consecutive object keys in the selector.
        if (deepFlag === true && i === 0) {
          return {
            v: value
          };
        }

        value = value.map(function (item) {
          return resolve(item, names[i], true);
        });

        // we mark this value as being multi-valued
        addMeta(value, { isMulti: true });

        // we unwrap for arrays of unit length
        // this avoids excess wrapping when resolving deeply nested arrays
        if (value.length === 1) {
          value = value[0];
        }
      } else {
        value = getValue(value, names[i]);
        deepFlag = false; // reset stop flag when we do a direct lookup
      }

      if (isNil(value)) return 'break';
    };

    _loop3: for (var i = 0; i < names.length; i++) {
      var _ret2 = _loop2(i);

      switch (_ret2) {
        case 'break':
          break _loop3;

        default:
          if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
      }
    }

    return value;
  }

  /**
   * Returns the full object to the resolved value given by the selector.
   * This function excludes empty values as they aren't practically useful.
   *
   * @param obj {Object} the object context
   * @param selector {String} dot separated path to field
   */
  function resolveObj(obj, selector) {
    if (isNil(obj)) return;

    var names = selector.split('.');
    var key = names[0];
    // get the next part of the selector
    var next = names.length === 1 || names.slice(1).join('.');
    var isIndex = key.match(/^\d+$/) !== null;
    var hasNext = names.length > 1;
    var result = void 0;
    var value = void 0;

    try {
      if (isArray(obj)) {
        if (isIndex) {
          result = getValue(obj, key);
          if (hasNext) {
            result = resolveObj(result, next);
          }
          assert(!isUndefined(result));
          result = [result];
        } else {
          result = [];
          each(obj, function (item) {
            value = resolveObj(item, selector);
            if (!isNil(value)) result.push(value);
          });
          assert(result.length > 0);
        }
      } else {
        value = getValue(obj, key);
        if (hasNext) {
          value = resolveObj(value, next);
        }
        assert(!isUndefined(value));
        result = {};
        result[key] = value;
      }
    } catch (e) {
      result = undefined;
    }

    return result;
  }

  /**
   * Walk the object graph and execute the given transform function
   * @param  {Object|Array} obj   The object to traverse
   * @param  {String} selector    The selector
   * @param  {Function} fn Function to execute for value at the end the traversal
   * @param  {Boolean} force Force generating missing parts of object graph
   * @return {*}
   */
  function traverse(obj, selector, fn) {
    var force = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    var names = selector.split('.');
    var key = names[0];
    var next = names.length === 1 || names.slice(1).join('.');

    if (names.length === 1) {
      fn(obj, key);
    } else {
      // nested objects
      if (isArray(obj) && !/^\d+$/.test(key)) {
        each(obj, function (item) {
          traverse(item, selector, fn, force);
        });
      } else {
        // force the rest of the graph while traversing
        if (force === true) {
          var exists = has(obj, key);
          if (!exists || isNil(obj[key])) {
            obj[key] = {};
          }
        }
        traverse(obj[key], next, fn, force);
      }
    }
  }

  /**
   * Set the value of the given object field
   *
   * @param obj {Object|Array} the object context
   * @param selector {String} path to field
   * @param value {*} the value to set
   */
  function setValue(obj, selector, value) {
    traverse(obj, selector, function (item, key) {
      item[key] = value;
    }, true);
  }

  function removeValue(obj, selector) {
    traverse(obj, selector, function (item, key) {
      if (isArray(item) && /^\d+$/.test(key)) {
        item.splice(parseInt(key), 1);
      } else if (isObject(item)) {
        delete item[key];
      }
    });
  }

  // quick reference for
  var primitives = [isString, isBoolean, isNumber, isDate, isNil, isRegExp];

  function isPrimitive(value) {
    for (var i = 0; i < primitives.length; i++) {
      if (primitives[i](value)) {
        return true;
      }
    }
    return false;
  }

  // primitives and user-defined types
  function isSimpleType(value) {
    return isPrimitive(value) || !isObjectLike(value);
  }

  /**
   * Simplify expression for easy evaluation with query operators map
   * @param expr
   * @returns {*}
   */
  function normalize(expr) {
    // normalized primitives
    if (isSimpleType(expr)) {
      return isRegExp(expr) ? { '$regex': expr } : { '$eq': expr };
    }

    // normalize object expression
    if (isObjectLike(expr)) {
      var exprKeys = keys(expr);
      var noQuery = intersection(ops(OP_QUERY), exprKeys).length === 0;

      // no valid query operator found, so we do simple comparison
      if (noQuery) {
        return { '$eq': expr };
      }

      // ensure valid regex
      if (inArray(exprKeys, '$regex')) {
        var regex = expr['$regex'];
        var options = expr['$options'] || '';
        var modifiers = '';
        if (isString(regex)) {
          modifiers += regex.ignoreCase || options.indexOf('i') >= 0 ? 'i' : '';
          modifiers += regex.multiline || options.indexOf('m') >= 0 ? 'm' : '';
          modifiers += regex.global || options.indexOf('g') >= 0 ? 'g' : '';
          regex = new RegExp(regex, modifiers);
        }
        expr['$regex'] = regex;
        delete expr['$options'];
      }
    }

    return expr;
  }

  /**
   * Computes the actual value of the expression using the given object as context
   *
   * @param obj the current object from the collection
   * @param expr the expression for the given field
   * @param field the field name (may also be an aggregate operator)
   * @param opt {Object} extra options
   * @returns {*}
   */
  function computeValue(obj, expr, field) {
    var opt = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    opt = opt || {};
    opt.root = opt.root || obj;

    // if the field of the object is a valid operator
    if (inArray(ops(OP_AGGREGATE), field)) {
      return aggregateOperators[field](obj, expr, opt);
    }

    // we also handle $group accumulator operators
    if (inArray(ops(OP_GROUP), field)) {
      // we first fully resolve the expression
      obj = computeValue(obj, expr, null, opt);
      assert(isArray(obj), field + ' expression must resolve to an array');
      // we pass a null expression because all values have been resolved
      return groupOperators[field](obj, null, opt);
    }

    // if expr is a variable for an object field
    // field not used in this case
    if (isString(expr) && expr.length > 0 && expr[0] === '$') {
      // we return system variables as literals
      if (inArray(SYS_VARS, expr)) {
        return systemVariables[expr](obj, null, opt);
      } else if (inArray(REDACT_VARS, expr)) {
        return expr;
      }

      // handle selectors with explicit prefix
      var sysVar = SYS_VARS.filter(function (v) {
        return expr.indexOf(v + '.') === 0;
      });

      if (sysVar.length === 1) {
        sysVar = sysVar[0];
        if (sysVar === '$$ROOT') {
          obj = opt.root;
        }
        expr = expr.substr(sysVar.length); // '.' prefix will be sliced off below
      }

      return resolve(obj, expr.slice(1));
    }

    // check and return value if already in a resolved state
    switch (jsType(expr)) {
      case 'array':
        return expr.map(function (item) {
          return computeValue(obj, item, null);
        });
      case 'object':
        var result = {};
        each(expr, function (val, key, _, halt) {
          result[key] = computeValue(obj, val, key, opt);
          // must run ONLY one aggregate operator per expression
          // if so, return result of the computed value
          if (inArray(ops(OP_AGGREGATE), key)) {
            // there should be only one operator
            assert(keys(expr).length === 1, "Invalid aggregation expression '" + JSON.stringify(expr) + "'");
            result = result[key];
            halt(); // break
          }
        });
        return result;
      default:
        return expr;
    }
  }

  /**
   * Returns a slice of the array
   *
   * @param  {Array} xs
   * @param  {Number} skip
   * @param  {Number} limit
   * @return {Array}
   */
  function slice(xs, skip) {
    var limit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    // MongoDB $slice works a bit differently from Array.slice
    // Uses single argument for 'limit' and array argument [skip, limit]
    if (isNil(limit)) {
      if (skip < 0) {
        skip = Math.max(0, xs.length + skip);
        limit = xs.length - skip + 1;
      } else {
        limit = skip;
        skip = 0;
      }
    } else {
      if (skip < 0) {
        skip = Math.max(0, xs.length + skip);
      }
      assert(limit > 0, 'Invalid argument value for $slice operator. Limit must be a positive number');
      limit += skip;
    }
    return Array.prototype.slice.apply(xs, [skip, limit]);
  }

  /**
   * Compute the standard deviation of the data set
   * @param  {Object} ctx An object of the context. Includes "data:Array" and "sampled:Boolean".
   * @return {Number}
   */
  function stddev(ctx) {
    var sum = ctx.data.reduce(function (acc, n) {
      return acc + n;
    }, 0);
    var N = ctx.data.length || 1;
    var correction = ctx.sampled === true ? 1 : 0;
    var avg = sum / (N - correction);
    return Math.sqrt(ctx.data.reduce(function (acc, n) {
      return acc + Math.pow(n - avg, 2);
    }, 0) / N);
  }

  /**
   * Redact an object
   * @param  {Object} obj The object to redact
   * @param  {*} expr The redact expression
   * @param  {*} opt  Options for value
   * @return {*} Returns the redacted value
   */
  function redactObj(obj, expr) {
    var opt = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    opt = opt || {};
    opt.root = opt.root || obj;

    var result = computeValue(obj, expr, null, opt);
    return inArray(REDACT_VARS, result) ? redactVariables[result](obj, expr, opt) : result;
  }

  /**
   * Exported to the users to allow writing custom operators
   */
  function _internal() {
    return {
      computeValue: computeValue,
      idKey: idKey,
      ops: ops,
      resolve: resolve,
      assert: assert,
      clone: clone,
      each: each,
      err: err,
      getType: getType,
      has: has,
      isArray: isArray,
      isBoolean: isBoolean,
      isDate: isDate,
      isEmpty: isEmpty,
      isEqual: isEqual,
      isFunction: isFunction,
      isNil: isNil,
      isNull: isNull,
      isNumber: isNumber,
      isObject: isObject,
      isRegExp: isRegExp,
      isString: isString,
      isUndefined: isUndefined,
      keys: keys
    };
  }

  /**
   * Cursor to iterate and perform filtering on matched objects
   * @param collection
   * @param query
   * @param projection
   * @constructor
   */

  var Cursor = function () {
    function Cursor(collection, query, projection) {
      _classCallCheck(this, Cursor);

      this.__query = query;
      this.__collection = collection;
      this.__projection = projection || query.__projection;
      this.__operators = {};
      this.__result = false;
      this.__position = 0;
    }

    _createClass(Cursor, [{
      key: '_fetch',
      value: function _fetch() {
        var _this2 = this;

        if (this.__result !== false) {
          return this.__result;
        }

        // inject projection operator
        if (isObject(this.__projection)) {
          Object.assign(this.__operators, { '$project': this.__projection });
        }

        assert(isArray(this.__collection), 'Input collection is not of valid type. Must be an Array.');

        // filter collection
        this.__result = this.__collection.filter(this.__query.test, this.__query);
        var pipeline = [];

        each(['$sort', '$skip', '$limit', '$project'], function (op) {
          if (has(_this2.__operators, op)) {
            var selected = {};
            selected[op] = _this2.__operators[op];
            pipeline.push(selected);
          }
        });

        if (pipeline.length > 0) {
          var aggregator = new Aggregator(pipeline);
          this.__result = aggregator.run(this.__result, this.__query);
        }
        return this.__result;
      }

      /**
       * Fetch and return all matched results
       * @returns {Array}
       */

    }, {
      key: 'all',
      value: function all() {
        return this._fetch();
      }

      /**
       * Fetch and return the first matching result
       * @returns {Object}
       */

    }, {
      key: 'first',
      value: function first() {
        return this.count() > 0 ? this._fetch()[0] : null;
      }

      /**
       * Fetch and return the last matching object from the result
       * @returns {Object}
       */

    }, {
      key: 'last',
      value: function last() {
        return this.count() > 0 ? this._fetch()[this.count() - 1] : null;
      }

      /**
       * Counts the number of matched objects found
       * @returns {Number}
       */

    }, {
      key: 'count',
      value: function count() {
        return this._fetch().length;
      }

      /**
       * Returns a cursor that begins returning results only after passing or skipping a number of documents.
       * @param {Number} n the number of results to skip.
       * @return {Cursor} Returns the cursor, so you can chain this call.
       */

    }, {
      key: 'skip',
      value: function skip(n) {
        Object.assign(this.__operators, { '$skip': n });
        return this;
      }

      /**
       * Constrains the size of a cursor's result set.
       * @param {Number} n the number of results to limit to.
       * @return {Cursor} Returns the cursor, so you can chain this call.
       */

    }, {
      key: 'limit',
      value: function limit(n) {
        Object.assign(this.__operators, { '$limit': n });
        return this;
      }

      /**
       * Returns results ordered according to a sort specification.
       * @param {Object} modifier an object of key and values specifying the sort order. 1 for ascending and -1 for descending
       * @return {Cursor} Returns the cursor, so you can chain this call.
       */

    }, {
      key: 'sort',
      value: function sort(modifier) {
        Object.assign(this.__operators, { '$sort': modifier });
        return this;
      }

      /**
       * Returns the next document in a cursor.
       * @returns {Object | Boolean}
       */

    }, {
      key: 'next',
      value: function next() {
        if (this.hasNext()) {
          return this._fetch()[this.__position++];
        }
        return null;
      }

      /**
       * Returns true if the cursor has documents and can be iterated.
       * @returns {boolean}
       */

    }, {
      key: 'hasNext',
      value: function hasNext() {
        return this.count() > this.__position;
      }

      /**
       * Specifies the exclusive upper bound for a specific field
       * @param expr
       * @returns {Number}
       */

    }, {
      key: 'max',
      value: function max(expr) {
        return groupOperators.$max(this._fetch(), expr);
      }

      /**
       * Specifies the inclusive lower bound for a specific field
       * @param expr
       * @returns {Number}
       */

    }, {
      key: 'min',
      value: function min(expr) {
        return groupOperators.$min(this._fetch(), expr);
      }

      /**
       * Applies a function to each document in a cursor and collects the return values in an array.
       * @param callback
       * @returns {Array}
       */

    }, {
      key: 'map',
      value: function map(callback) {
        return this._fetch().map(callback);
      }

      /**
       * Applies a JavaScript function for every document in a cursor.
       * @param callback
       */

    }, {
      key: 'forEach',
      value: function forEach(callback) {
        each(this._fetch(), callback);
      }

      /**
       * Applies an [ES2015 Iteration protocol][] compatible implementation
       * [ES2015 Iteration protocol]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
       * @returns {Object}
       */

    }, {
      key: Symbol.iterator,
      value: function value() {
        var self = this;
        return {
          next: function next() {
            if (!self.hasNext()) {
              return { done: true };
            }
            return {
              done: false,
              value: self.next()
            };
          }
        };
      }
    }]);

    return Cursor;
  }();

  /**
   * Query object to test collection elements with
   * @param criteria the pass criteria for the query
   * @param projection optional projection specifiers
   * @constructor
   */


  var Query = function () {
    function Query(criteria, projection) {
      _classCallCheck(this, Query);

      this.__criteria = criteria;
      this.__projection = projection;
      this.__compiled = [];
      this._compile();
    }

    _createClass(Query, [{
      key: '_compile',
      value: function _compile() {
        var _this3 = this;

        if (isEmpty(this.__criteria)) return;

        assert(isObject(this.__criteria), 'Criteria must be of type Object');

        var whereOperator = void 0;

        each(this.__criteria, function (expr, field) {
          // save $where operators to be executed after other operators
          if ('$where' === field) {
            whereOperator = { field: field, expr: expr };
          } else if (inArray(['$and', '$or', '$nor'], field)) {
            _this3._processOperator(field, field, expr);
          } else {
            // normalize expression
            expr = normalize(expr);
            each(expr, function (val, op) {
              _this3._processOperator(field, op, val);
            });
          }

          if (isObject(whereOperator)) {
            _this3._processOperator(whereOperator.field, whereOperator.field, whereOperator.expr);
          }
        });
      }
    }, {
      key: '_processOperator',
      value: function _processOperator(field, operator, value) {
        if (inArray(ops(OP_QUERY), operator)) {
          this.__compiled.push(queryOperators[operator](field, value));
        } else {
          err("Invalid query operator '" + operator + "' detected");
        }
      }

      /**
       * Checks if the object passes the query criteria. Returns true if so, false otherwise.
       * @param obj
       * @returns {boolean}
       */

    }, {
      key: 'test',
      value: function test(obj) {
        for (var i = 0, len = this.__compiled.length; i < len; i++) {
          if (!this.__compiled[i].test(obj)) {
            return false;
          }
        }
        return true;
      }

      /**
       * Performs a query on a collection and returns a cursor object.
       * @param collection
       * @param projection
       * @returns {Cursor}
       */

    }, {
      key: 'find',
      value: function find(collection, projection) {
        return new Cursor(collection, this, projection);
      }

      /**
       * Remove matched documents from the collection returning the remainder
       * @param collection
       * @returns {Array}
       */

    }, {
      key: 'remove',
      value: function remove(collection) {
        var _this4 = this;

        return collection.reduce(function (acc, obj) {
          if (!_this4.test(obj)) {
            acc.push(obj);
          }
          return acc;
        }, []);
      }
    }]);

    return Query;
  }();

  /**
   * Performs a query on a collection and returns a cursor object.
   *
   * @param collection
   * @param criteria
   * @param projection
   * @returns {Cursor}
   */


  function find(collection, criteria, projection) {
    return new Query(criteria).find(collection, projection);
  }

  /**
   * Returns a new array without objects which match the criteria
   *
   * @param collection
   * @param criteria
   * @returns {Array}
   */
  function remove(collection, criteria) {
    return new Query(criteria).remove(collection);
  }

  /**
   * Mixin for Collection types that provide a method `toJSON() -> Array[Object]`
   */
  var CollectionMixin = {

    /**
     * Runs a query and returns a cursor to the result
     * @param criteria
     * @param projection
     * @returns {Cursor}
     */
    query: function query(criteria, projection) {
      return find(this.toJSON(), criteria, projection);
    },


    /**
     * Runs the given aggregation operators on this collection
     * @params pipeline
     * @returns {Array}
     */
    aggregate: function aggregate(pipeline) {
      return _aggregate.call(null, this.toJSON(), pipeline);
    }
  };

  var VERSION = '2.0.0';

  exports.CollectionMixin = CollectionMixin;
  exports.VERSION = VERSION;
  exports._internal = _internal;
  exports.addOperators = addOperators;
  exports.OP_AGGREGATE = OP_AGGREGATE;
  exports.OP_GROUP = OP_GROUP;
  exports.OP_PIPELINE = OP_PIPELINE;
  exports.OP_PROJECTION = OP_PROJECTION;
  exports.OP_QUERY = OP_QUERY;
  exports.Aggregator = Aggregator;
  exports.aggregate = _aggregate;
  exports.Cursor = Cursor;
  exports.Query = Query;
  exports.find = find;
  exports.remove = remove;

  Object.defineProperty(exports, '__esModule', { value: true });
});

