//! mingo.js 2.5.3
//! Copyright (c) 2020 Francis Asante
//! MIT

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.mingo = factory());
}(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  // Javascript native types
  var T_NULL = 'null';
  var T_UNDEFINED = 'undefined';
  var T_BOOL = 'bool';
  var T_BOOLEAN = 'boolean';
  var T_NUMBER = 'number';
  var T_STRING = 'string';
  var T_DATE = 'date';
  var T_REGEX = 'regex';
  var T_REGEXP = 'regexp';
  var T_ARRAY = 'array';
  var T_OBJECT = 'object';
  var T_FUNCTION = 'function'; // no array, object, or function types

  var JS_SIMPLE_TYPES = [T_NULL, T_UNDEFINED, T_BOOLEAN, T_NUMBER, T_STRING, T_DATE, T_REGEXP]; // operator classes

  var OP_EXPRESSION = 'expression';
  var OP_GROUP = 'group';
  var OP_PIPELINE = 'pipeline';
  var OP_PROJECTION = 'projection';
  var OP_QUERY = 'query';
  var MISSING = function MISSING() {};

  /**
   * Utility functions
   */

  if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
      value: function value(valueToFind, fromIndex) {
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        } // 1. Let O be ? ToObject(this value).


        var o = Object(this); // 2. Let len be ? ToLength(? Get(O, "length")).

        var len = o.length >>> 0; // 3. If len is 0, return false.

        if (len === 0) {
          return false;
        } // 4. Let n be ? ToInteger(fromIndex).
        //    (If fromIndex is undefined, this step produces the value 0.)


        var n = fromIndex | 0; // 5. If n ≥ 0, then
        //  a. Let k be n.
        // 6. Else n < 0,
        //  a. Let k be len + n.
        //  b. If k < 0, let k be 0.

        var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        function sameValueZero(x, y) {
          return x === y || typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y);
        } // 7. Repeat, while k < len


        while (k < len) {
          // a. Let elementK be the result of ? Get(O, ! ToString(k)).
          // b. If SameValueZero(valueToFind, elementK) is true, return true.
          if (sameValueZero(o[k], valueToFind)) {
            return true;
          } // c. Increase k by 1.


          k++;
        } // 8. Return false


        return false;
      }
    });
  }

  var arrayPush = Array.prototype.push;
  function assert(condition, message) {
    if (!condition) err(message);
  }
  /**
   * Deep clone an object
   */

  function cloneDeep(obj) {
    switch (jsType(obj)) {
      case T_ARRAY:
        return obj.map(cloneDeep);

      case T_OBJECT:
        return objectMap(obj, cloneDeep);

      default:
        return obj;
    }
  }
  /**
   * Shallow clone an object
   */

  function clone(obj) {
    switch (jsType(obj)) {
      case T_ARRAY:
        return into([], obj);

      case T_OBJECT:
        return Object.assign({}, obj);

      default:
        return obj;
    }
  }
  function getType(v) {
    if (v === null) return 'Null';
    if (v === undefined) return 'Undefined';
    return v.constructor.name;
  }
  function jsType(v) {
    return getType(v).toLowerCase();
  }
  function isBoolean(v) {
    return jsType(v) === T_BOOLEAN;
  }
  function isString(v) {
    return jsType(v) === T_STRING;
  }
  function isNumber(v) {
    return jsType(v) === T_NUMBER;
  }
  var isArray = Array.isArray || function (v) {
    return !!v && v.constructor === Array;
  };
  function isObject(v) {
    return !!v && v.constructor === Object;
  }
  function isObjectLike(v) {
    return v === Object(v);
  } // objects, arrays, functions, date, custom object

  function isDate(v) {
    return jsType(v) === T_DATE;
  }
  function isRegExp(v) {
    return jsType(v) === T_REGEXP;
  }
  function isFunction(v) {
    return jsType(v) === T_FUNCTION;
  }
  function isNil(v) {
    return v === null || v === undefined;
  }
  function isNull(v) {
    return v === null;
  }
  function isUndefined(v) {
    return v === undefined;
  }
  function inArray(arr, item) {
    return arr.includes(item);
  }
  function notInArray(arr, item) {
    return !inArray(arr, item);
  }
  function truthy(arg) {
    return !!arg;
  }
  function isEmpty(x) {
    return isNil(x) || isArray(x) && x.length === 0 || isObject(x) && keys(x).length === 0 || !x;
  } // ensure a value is an array

  function ensureArray(x) {
    return isArray(x) ? x : [x];
  }
  function has(obj, prop) {
    return obj.hasOwnProperty(prop);
  }
  function err(s) {
    throw new Error(s);
  }
  var keys = Object.keys; // ////////////////// UTILS ////////////////////

  /**
   * Iterate over an array or object
   * @param  {Array|Object} obj An object-like value
   * @param  {Function} fn The callback to run per item
   * @param  {*}   ctx  The object to use a context
   * @return {void}
   */

  function each(obj, fn, ctx) {
    fn = fn.bind(ctx);

    if (isArray(obj)) {
      for (var i = 0, len = obj.length; i < len; i++) {
        if (fn(obj[i], i, obj) === false) break;
      }
    } else {
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
          if (fn(obj[k], k, obj) === false) break;
        }
      }
    }
  }
  /**
   * Transform values in an object
   *
   * @param  {Object}   obj   An object whose values to transform
   * @param  {Function} fn The transform function
   * @param  {*}   ctx The value to use as the "this" context for the transform
   * @return {Array|Object} Result object after applying the transform
   */

  function objectMap(obj, fn, ctx) {
    fn = fn.bind(ctx);
    var o = {};
    var objKeys = keys(obj);

    for (var i = 0; i < objKeys.length; i++) {
      var k = objKeys[i];
      o[k] = fn(obj[k], k);
    }

    return o;
  }
  /**
   * Deep merge objects or arrays.
   * When the inputs have unmergeable types, the source value (right hand side) is returned.
   * If inputs are arrays of same length and all elements are mergable, elements in the same position are merged together.
   * If any of the elements are unmergeable, elements in the source are appended to the target.
   * @param target {Object|Array} the target to merge into
   * @param obj {Object|Array} the source object
   */

  function merge(target, obj) {
    var opt = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    // take care of missing inputs
    if (target === MISSING) return obj;
    if (obj === MISSING) return target;
    var inputs = [target, obj];

    if (!(inputs.every(isObject) || inputs.every(isArray))) {
      throw Error('mismatched types. must both be array or object');
    } // default options


    opt.flatten = opt.flatten || false;

    if (isArray(target)) {
      if (opt.flatten) {
        var i = 0;
        var j = 0;

        while (i < target.length && j < obj.length) {
          target[i] = merge(target[i++], obj[j++], opt);
        }

        while (j < obj.length) {
          target.push(obj[j++]);
        }
      } else {
        arrayPush.apply(target, obj);
      }
    } else {
      Object.keys(obj).forEach(function (k) {
        if (target.hasOwnProperty(k)) {
          target[k] = merge(target[k], obj[k], opt);
        } else {
          target[k] = obj[k];
        }
      });
    }

    return target;
  }
  /**
   * Reduce any array-like object
   * @param collection
   * @param fn
   * @param accumulator
   * @returns {*}
   */

  function reduce(collection, fn, accumulator) {
    if (isArray(collection)) return collection.reduce(fn, accumulator); // array-like objects

    each(collection, function (v, k) {
      return accumulator = fn(accumulator, v, k, collection);
    });
    return accumulator;
  }
  /**
   * Returns the intersection between two arrays
   *
   * @param  {Array} xs The first array
   * @param  {Array} ys The second array
   * @return {Array}    Result array
   */

  function intersection(xs, ys) {
    var hashes = ys.map(hashCode);
    return xs.filter(function (v) {
      return inArray(hashes, hashCode(v));
    });
  }
  /**
   * Returns the union of two arrays
   *
   * @param  {Array} xs The first array
   * @param  {Array} ys The second array
   * @return {Array}   The result array
   */

  function union(xs, ys) {
    return into(into([], xs), ys.filter(notInArray.bind(null, xs)));
  }
  /**
   * Flatten the array
   *
   * @param  {Array} xs The array to flatten
   * @param {Number} depth The number of nested lists to iterate
   */

  function flatten(xs) {
    var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
    var arr = [];

    function flatten2(ys, iter) {
      for (var i = 0, len = ys.length; i < len; i++) {
        if (isArray(ys[i]) && (iter > 0 || iter < 0)) {
          flatten2(ys[i], Math.max(-1, iter - 1));
        } else {
          arr.push(ys[i]);
        }
      }
    }

    flatten2(xs, depth);
    return arr;
  }
  /**
   * Unwrap a single element array to specified depth
   * @param {Array} arr
   * @param {Number} depth
   */

  function unwrap(arr, depth) {
    if (depth < 1) return arr;

    while (depth-- && isArray(arr) && arr.length === 1) {
      arr = arr[0];
    }

    return arr;
  }
  /**
   * Determine whether two values are the same or strictly equivalent
   *
   * @param  {*}  a The first value
   * @param  {*}  b The second value
   * @return {Boolean}   Result of comparison
   */

  function isEqual(a, b) {
    var lhs = [a];
    var rhs = [b];

    while (lhs.length > 0) {
      a = lhs.pop();
      b = rhs.pop(); // strictly equal must be equal.

      if (a === b) continue; // unequal types and functions cannot be equal.

      var type = jsType(a);
      if (type !== jsType(b) || type === T_FUNCTION) return false; // leverage toString for Date and RegExp types

      switch (type) {
        case T_ARRAY:
          if (a.length !== b.length) return false; //if (a.length === b.length && a.length === 0) continue

          into(lhs, a);
          into(rhs, b);
          break;

        case T_OBJECT:
          // deep compare objects
          var ka = keys(a);
          var kb = keys(b); // check length of keys early

          if (ka.length !== kb.length) return false; // we know keys are strings so we sort before comparing

          ka.sort();
          kb.sort(); // compare keys

          for (var i = 0, len = ka.length; i < len; i++) {
            var temp = ka[i];

            if (temp !== kb[i]) {
              return false;
            } else {
              // save later work
              lhs.push(a[temp]);
              rhs.push(b[temp]);
            }
          }

          break;

        default:
          // compare encoded values
          if (encode(a) !== encode(b)) return false;
      }
    }

    return lhs.length === 0;
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
      var k = hashCode(item);

      if (!has(h, k)) {
        arr.push(item);
        h[k] = 0;
      }
    });
    return arr;
  }
  /**
   * Encode value to string using a simple non-colliding stable scheme.
   *
   * @param value
   * @returns {*}
   */

  function encode(value) {
    var type = jsType(value);

    switch (type) {
      case T_BOOLEAN:
      case T_NUMBER:
      case T_REGEXP:
        return value.toString();

      case T_STRING:
        return JSON.stringify(value);

      case T_DATE:
        return value.toISOString();

      case T_NULL:
      case T_UNDEFINED:
        return type;

      case T_ARRAY:
        return '[' + value.map(encode) + ']';

      default:
        var prefix = type === T_OBJECT ? '' : "".concat(getType(value));
        var objKeys = keys(value);
        objKeys.sort();
        return "".concat(prefix, "{") + objKeys.map(function (k) {
          return "".concat(encode(k), ":").concat(encode(value[k]));
        }) + '}';
    }
  }
  /**
   * Generate hash code
   * This selected function is the result of benchmarking various hash functions.
   * This version performs well and can hash 10^6 documents in ~3s with on average 100 collisions.
   *
   * @param value
   * @returns {*}
   */

  function hashCode(value) {
    if (isNil(value)) return null;
    var hash = 0;
    var s = encode(value);
    var i = s.length;

    while (i) {
      hash = (hash << 5) - hash ^ s.charCodeAt(--i);
    }

    return hash >>> 0;
  }
  /**
   * Default compare function
   * @param {*} a
   * @param {*} b
   */

  function compare(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
  /**
   * Returns a (stably) sorted copy of list, ranked in ascending order by the results of running each value through iteratee
   *
   * This implementation treats null/undefined sort keys as less than every other type
   *
   * @param {Array}   collection
   * @param {Function} fn The function used to resolve sort keys
   * @param {Function} cmp The comparator function to use for comparing values
   * @return {Array} Returns a new sorted array by the given iteratee
   */

  function sortBy(collection, fn, cmp) {
    var sorted = [];
    var result = [];
    var hash = {};
    cmp = cmp || compare;
    if (isEmpty(collection)) return collection;

    for (var i = 0; i < collection.length; i++) {
      var obj = collection[i];
      var key = fn(obj, i); // objects with nil keys will go in first

      if (isNil(key)) {
        result.push(obj);
      } else {
        if (hash[key]) {
          hash[key].push(obj);
        } else {
          hash[key] = [obj];
        }

        sorted.push(key);
      }
    } // use native array sorting but enforce stableness


    sorted.sort(cmp);

    for (var _i = 0; _i < sorted.length; _i++) {
      into(result, hash[sorted[_i]]);
    }

    return result;
  }
  /**
   * Groups the collection into sets by the returned key
   *
   * @param collection
   * @param fn {Function} to compute the group key of an item in the collection
   * @returns {{keys: Array, groups: Array}}
   */

  function groupBy(collection, fn) {
    var result = {
      'keys': [],
      'groups': []
    };
    var lookup = {};
    each(collection, function (obj) {
      var key = fn(obj);
      var hash = hashCode(key);
      var index = -1;

      if (lookup[hash] === undefined) {
        index = result.keys.length;
        lookup[hash] = index;
        result.keys.push(key);
        result.groups.push([]);
      }

      index = lookup[hash];
      result.groups[index].push(obj);
    });
    return result;
  }
  /**
   * Push elements in given array into target array
   *
   * @param {*} target The array to push into
   * @param {*} xs The array of elements to push
   */

  function into(target, xs) {
    arrayPush.apply(target, xs);
    return target;
  }
  /**
   * Find the insert index for the given key in a sorted array.
   *
   * @param {*} array The sorted array to search
   * @param {*} item The search key
   */

  function findInsertIndex(array, item) {
    // uses binary search
    var lo = 0;
    var hi = array.length - 1;

    while (lo <= hi) {
      var mid = Math.round(lo + (hi - lo) / 2);

      if (item < array[mid]) {
        hi = mid - 1;
      } else if (item > array[mid]) {
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

    return function (memo) {
      return function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var key = hashCode(args);

        if (!has(memo, key)) {
          memo[key] = fn.apply(_this, args);
        }

        return memo[key];
      };
    }({
      /* storage */
    });
  } // mingo internal

  /**
   * Retrieve the value of a given key on an object
   * @param obj
   * @param field
   * @returns {*}
   * @private
   */

  function getValue(obj, field) {
    return isObjectLike(obj) ? obj[field] : undefined;
  }
  /**
   * Resolve the value of the field (dot separated) on the given object
   * @param obj {Object} the object context
   * @param selector {String} dot separated path to field
   * @returns {*}
   */

  function resolve(obj, selector) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var depth = 0; // options

    options.meta = options.meta || false;

    function resolve2(o, path) {
      var value = o;

      for (var i = 0; i < path.length; i++) {
        var field = path[i];
        var isText = field.match(/^\d+$/) === null;

        if (isText && isArray(value)) {
          // On the first iteration, we check if we received a stop flag.
          // If so, we stop to prevent iterating over a nested array value
          // on consecutive object keys in the selector.
          if (i === 0 && depth > 0) break;
          depth += 1;
          path = path.slice(i);
          value = reduce(value, function (acc, item) {
            var v = resolve2(item, path);
            if (v !== undefined) acc.push(v);
            return acc;
          }, []);
          break;
        } else {
          value = getValue(value, field);
        }

        if (value === undefined) break;
      }

      return value;
    }

    obj = inArray(JS_SIMPLE_TYPES, jsType(obj)) ? obj : resolve2(obj, selector.split('.'));
    return options.meta ? {
      result: obj,
      depth: depth
    } : obj;
  }
  /**
   * Returns the full object to the resolved value given by the selector.
   * This function excludes empty values as they aren't practically useful.
   *
   * @param obj {Object} the object context
   * @param selector {String} dot separated path to field
   */

  function resolveObj(obj, selector) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    // options
    options.preserveMissingValues = options.preserveMissingValues || false;
    var names = selector.split('.');
    var key = names[0]; // get the next part of the selector

    var next = names.length === 1 || names.slice(1).join('.');
    var isIndex = key.match(/^\d+$/) !== null;
    var hasNext = names.length > 1;
    var result;
    var value;

    try {
      if (isArray(obj)) {
        if (isIndex) {
          result = getValue(obj, Number(key));

          if (hasNext) {
            result = resolveObj(result, next, options);
          }

          result = [result];
        } else {
          result = [];
          each(obj, function (item) {
            value = resolveObj(item, selector, options);

            if (options.preserveMissingValues) {
              if (value === undefined) {
                value = MISSING;
              }

              result.push(value);
            } else if (value !== undefined) {
              result.push(value);
            }
          });
        }
      } else {
        value = getValue(obj, key);

        if (hasNext) {
          value = resolveObj(value, next, options);
        }

        assert(value !== undefined);
        result = {};
        result[key] = value;
      }
    } catch (e) {
      result = undefined;
    }

    return result;
  }
  /**
   * Filter out all MISSING values from the object in-place
   * @param {*} obj The object the filter
   */

  function filterMissing(obj) {
    if (isArray(obj)) {
      for (var i = obj.length - 1; i >= 0; i--) {
        if (obj[i] === MISSING) {
          obj.splice(i, 1);
        } else {
          filterMissing(obj[i]);
        }
      }
    } else if (isObject(obj)) {
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
          filterMissing(obj[k]);
        }
      }
    }

    return obj;
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
      // force the rest of the graph while traversing
      if (force === true && isNil(obj[key])) {
        obj[key] = {};
      }

      traverse(obj[key], next, fn, force);
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
  /**
   * Check whether the given name is an operator. We assume any field name starting with '$' is an operator.
   * This is cheap and safe to do since keys beginning with '$' should be reserved for internal use.
   * @param {String} name
   */

  function isOperator(name) {
    return !!name && name[0] === '$';
  }
  /**
   * Simplify expression for easy evaluation with query operators map
   * @param expr
   * @returns {*}
   */

  function normalize(expr) {
    // normalized primitives
    if (inArray(JS_SIMPLE_TYPES, jsType(expr))) {
      return isRegExp(expr) ? {
        '$regex': expr
      } : {
        '$eq': expr
      };
    } // normalize object expression


    if (isObjectLike(expr)) {
      var exprKeys = keys(expr); // no valid query operator found, so we do simple comparison

      if (!exprKeys.some(isOperator)) {
        return {
          '$eq': expr
        };
      } // ensure valid regex


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

    return xs.slice(skip, limit);
  }
  /**
   * Compute the standard deviation of the data set
   * @param {Array} array of numbers
   * @param {Boolean} if true calculates a sample standard deviation, otherwise calculates a population stddev
   * @return {Number}
   */

  function stddev(data, sampled) {
    var sum = reduce(data, function (acc, n) {
      return acc + n;
    }, 0);
    var N = data.length || 1;
    var correction = sampled && 1 || 0;
    var avg = sum / N;
    return Math.sqrt(reduce(data, function (acc, n) {
      return acc + Math.pow(n - avg, 2);
    }, 0) / (N - correction));
  }
  /**
   * Exported to the users to allow writing custom operators
   */

  function moduleApi() {
    return {
      assert: assert,
      clone: clone,
      cloneDeep: cloneDeep,
      each: each,
      err: err,
      hashCode: hashCode,
      getType: getType,
      has: has,
      includes: inArray.bind(null),
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
      keys: keys,
      reduce: reduce,
      resolve: resolve,
      resolveObj: resolveObj
    };
  }

  var _internal = function _internal() {
    return Object.assign({
      computeValue: computeValue,
      ops: ops
    }, moduleApi());
  }; // Settings used by Mingo internally

  var settings = {
    key: '_id'
  };
  /**
   * Setup default settings for Mingo
   * @param options
   */

  function setup(options) {
    Object.assign(settings, options || {});
  }
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
    },
    '$$REMOVE': function $$REMOVE(obj, expr, opt) {
      return undefined;
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
      var result;
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
  }; // system variables

  var SYS_VARS = keys(systemVariables);
  var REDACT_VARS = keys(redactVariables);
  /**
   * Returns the key used as the collection's objects ids
   */

  function idKey() {
    return settings.key;
  }
  /**
   * Returns the operators defined for the given operator classes
   */

  function ops() {
    // Workaround for browser-compatibility bug: on iPhone 6S Safari (and
    // probably some other platforms), `arguments` isn't detected as an array,
    // but has a length field, so functions like `reduce` end up including the
    // length field in their iteration. Copy to a real array.
    var args = Array.prototype.slice.call(arguments);
    return reduce(args, function (acc, cls) {
      return into(acc, keys(OPERATORS[cls]));
    }, []);
  }
  /**
   * Returns the result of evaluating a $group operation over a collection
   *
   * @param collection
   * @param field the name of the aggregate operator or field
   * @param expr the expression of the aggregate operator for the field
   * @returns {*}
   */

  function accumulate(collection, field, expr) {
    if (has(OPERATORS[OP_GROUP], field)) {
      return OPERATORS[OP_GROUP][field](collection, expr);
    }

    if (isObject(expr)) {
      var result = {};
      each(expr, function (val, key) {
        result[key] = accumulate(collection, key, expr[key]); // must run ONLY one group operator per expression
        // if so, return result of the computed value

        if (has(OPERATORS[OP_GROUP], key)) {
          result = result[key]; // if there are more keys in expression this is bad

          assert(keys(expr).length === 1, "Invalid $group expression '" + JSON.stringify(expr) + "'");
          return false; // break
        }
      });
      return result;
    }
  }
  /**
   * Computes the actual value of the expression using the given object as context
   *
   * @param obj the current object from the collection
   * @param expr the expression for the given field
   * @param operator the operator to resolve the field with
   * @param opt {Object} extra options
   * @returns {*}
   */

  function computeValue(obj, expr) {
    var operator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var opt = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    opt.root = opt.root || obj; // if the field of the object is a valid operator

    if (has(OPERATORS[OP_EXPRESSION], operator)) {
      return OPERATORS[OP_EXPRESSION][operator](obj, expr, opt);
    } // we also handle $group accumulator operators


    if (has(OPERATORS[OP_GROUP], operator)) {
      // we first fully resolve the expression
      obj = computeValue(obj, expr, null, opt);
      assert(isArray(obj), operator + ' expression must resolve to an array'); // we pass a null expression because all values have been resolved

      return OPERATORS[OP_GROUP][operator](obj, null, opt);
    } // if expr is a variable for an object field
    // field not used in this case


    if (isString(expr) && expr.length > 0 && expr[0] === '$') {
      // we return system variables as literals
      if (inArray(SYS_VARS, expr)) {
        return systemVariables[expr](obj, null, opt);
      } else if (inArray(REDACT_VARS, expr)) {
        return expr;
      } // handle selectors with explicit prefix


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
    } // check and return value if already in a resolved state


    switch (jsType(expr)) {
      case T_ARRAY:
        return expr.map(function (item) {
          return computeValue(obj, item);
        });

      case T_OBJECT:
        var result = {};
        each(expr, function (val, key) {
          result[key] = computeValue(obj, val, key, opt); // must run ONLY one aggregate operator per expression
          // if so, return result of the computed value

          if ([OP_EXPRESSION, OP_GROUP].some(function (c) {
            return has(OPERATORS[c], key);
          })) {
            // there should be only one operator
            assert(keys(expr).length === 1, "Invalid aggregation expression '" + JSON.stringify(expr) + "'");
            result = result[key];
            return false; // break
          }
        });
        return result;

      default:
        return expr;
    }
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
    opt.root = opt.root || obj;
    var result = computeValue(obj, expr, null, opt);
    return inArray(REDACT_VARS, result) ? redactVariables[result](obj, expr, opt) : result;
  }

  /**
   * Returns the absolute value of a number.
   * https://docs.mongodb.com/manual/reference/operator/aggregation/abs/#exp._S_abs
   *
   * @param obj
   * @param expr
   * @return {Number|null|NaN}
   */

  function $abs(obj, expr) {
    var val = computeValue(obj, expr);
    return val === null || val === undefined ? null : Math.abs(val);
  }
  /**
   * Computes the sum of an array of numbers.
   *
   * @param obj
   * @param expr
   * @returns {Object}
   */

  function $add(obj, expr) {
    var args = computeValue(obj, expr);
    var foundDate = false;
    var result = reduce(args, function (acc, val) {
      if (isDate(val)) {
        assert(!foundDate, "'$add' can only have one date value");
        foundDate = true;
        val = val.getTime();
      } // assume val is a number


      acc += val;
      return acc;
    }, 0);
    return foundDate ? new Date(result) : result;
  }
  /**
   * Returns the smallest integer greater than or equal to the specified number.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $ceil(obj, expr) {
    var arg = computeValue(obj, expr);
    if (isNil(arg)) return null;
    assert(isNumber(arg) || isNaN(arg), '$ceil expression must resolve to a number.');
    return Math.ceil(arg);
  }
  /**
   * Takes two numbers and divides the first number by the second.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $divide(obj, expr) {
    var args = computeValue(obj, expr);
    return args[0] / args[1];
  }
  /**
   * Raises Euler’s number (i.e. e ) to the specified exponent and returns the result.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $exp(obj, expr) {
    var arg = computeValue(obj, expr);
    if (isNil(arg)) return null;
    assert(isNumber(arg) || isNaN(arg), '$exp expression must resolve to a number.');
    return Math.exp(arg);
  }
  /**
   * Returns the largest integer less than or equal to the specified number.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $floor(obj, expr) {
    var arg = computeValue(obj, expr);
    if (isNil(arg)) return null;
    assert(isNumber(arg) || isNaN(arg), '$floor expression must resolve to a number.');
    return Math.floor(arg);
  }
  /**
   * Calculates the natural logarithm ln (i.e loge) of a number and returns the result as a double.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $ln(obj, expr) {
    var arg = computeValue(obj, expr);
    if (isNil(arg)) return null;
    assert(isNumber(arg) || isNaN(arg), '$ln expression must resolve to a number.');
    return Math.log(arg);
  }
  /**
   * Calculates the log of a number in the specified base and returns the result as a double.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $log(obj, expr) {
    var args = computeValue(obj, expr);
    var msg = '$log expression must resolve to array(2) of numbers';
    assert(isArray(args) && args.length === 2, msg);
    if (args.some(isNil)) return null;
    assert(args.some(isNaN) || args.every(isNumber), msg);
    return Math.log10(args[0]) / Math.log10(args[1]);
  }
  /**
   * Calculates the log base 10 of a number and returns the result as a double.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $log10(obj, expr) {
    var arg = computeValue(obj, expr);
    if (isNil(arg)) return null;
    assert(isNumber(arg) || isNaN(arg), '$log10 expression must resolve to a number.');
    return Math.log10(arg);
  }
  /**
   * Takes two numbers and calculates the modulo of the first number divided by the second.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $mod(obj, expr) {
    var args = computeValue(obj, expr);
    return args[0] % args[1];
  }
  /**
   * Computes the product of an array of numbers.
   *
   * @param obj
   * @param expr
   * @returns {Object}
   */

  function $multiply(obj, expr) {
    var args = computeValue(obj, expr);
    return reduce(args, function (acc, num) {
      return acc * num;
    }, 1);
  }
  /**
   * Raises a number to the specified exponent and returns the result.
   *
   * @param obj
   * @param expr
   * @returns {Object}
   */

  function $pow(obj, expr) {
    var args = computeValue(obj, expr);
    assert(isArray(args) && args.length === 2 && args.every(isNumber), '$pow expression must resolve to array(2) of numbers');
    assert(!(args[0] === 0 && args[1] < 0), '$pow cannot raise 0 to a negative exponent');
    return Math.pow(args[0], args[1]);
  }
  /**
   * Rounds a number to to a whole integer or to a specified decimal place.
   * @param {*} obj
   * @param {*} expr
   */

  function $round(obj, expr) {
    var args = computeValue(obj, expr);
    var num = args[0];
    var place = args[1];
    if (isNil(num) || isNaN(num) || Math.abs(num) === Infinity) return num;
    assert(isNumber(num), '$round expression must resolve to a number.');
    return truncate(num, place, true);
  }
  /**
   * Calculates the square root of a positive number and returns the result as a double.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $sqrt(obj, expr) {
    var n = computeValue(obj, expr);
    if (isNil(n)) return null;
    assert(isNumber(n) && n > 0 || isNaN(n), '$sqrt expression must resolve to non-negative number.');
    return Math.sqrt(n);
  }
  /**
   * Takes an array that contains two numbers or two dates and subtracts the second value from the first.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $subtract(obj, expr) {
    var args = computeValue(obj, expr);
    return args[0] - args[1];
  }
  /**
   * Truncates a number to a whole integer or to a specified decimal place.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $trunc(obj, expr) {
    var arr = computeValue(obj, expr);
    var num = arr[0];
    var places = arr[1];
    if (isNil(num) || isNaN(num) || Math.abs(num) === Infinity) return num;
    assert(isNumber(num), '$trunc expression must resolve to a number.');
    assert(isNil(places) || isNumber(places) && places > -20 && places < 100, "$trunc expression has invalid place");
    return truncate(num, places, false);
  }
  /**
   * Truncates integer value to number of places. If roundOff is specified round value instead to the number of places
   * @param {Number} num
   * @param {Number} places
   * @param {Boolean} roundOff
   */

  function truncate(num, places, roundOff) {
    places = places || 0;
    var sign = Math.abs(num) === num ? 1 : -1;
    num = Math.abs(num);
    var result = Math.trunc(num);
    var decimals = num - result;

    if (places === 0) {
      var firstDigit = Math.trunc(10 * decimals);

      if (roundOff && (result & 1) === 1 && firstDigit >= 5) {
        result++;
      }
    } else if (places > 0) {
      var offset = Math.pow(10, places);
      var remainder = Math.trunc(decimals * offset); // last digit before cut off

      var lastDigit = Math.trunc(decimals * offset * 10) % 10; // add one if last digit is greater than 5

      if (roundOff && lastDigit > 5) {
        remainder += 1;
      } // compute decimal remainder and add to whole number


      result += remainder / offset;
    } else if (places < 0) {
      // handle negative decimal places
      var _offset = Math.pow(10, -1 * places);

      var excess = result % _offset;
      result = Math.max(0, result - excess); // for negative values the absolute must increase so we round up the last digit if >= 5

      if (roundOff && sign === -1) {
        while (excess > 10) {
          excess -= excess % 10;
        }

        if (result > 0 && excess >= 5) {
          result += _offset;
        }
      }
    }

    return result * sign;
  }

  /**
   * Returns the element at the specified array index.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */

  function $arrayElemAt(obj, expr) {
    var arr = computeValue(obj, expr);
    assert(isArray(arr) && arr.length === 2, '$arrayElemAt expression must resolve to array(2)');
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
  }
  /**
   * Converts an array of key value pairs to a document.
   */

  function $arrayToObject(obj, expr) {
    var arr = computeValue(obj, expr);
    assert(isArray(arr), '$arrayToObject expression must resolve to an array');
    return reduce(arr, function (newObj, val) {
      if (isArray(val) && val.length == 2) {
        newObj[val[0]] = val[1];
      } else {
        assert(isObject(val) && has(val, 'k') && has(val, 'v'), '$arrayToObject expression is invalid.');
        newObj[val.k] = val.v;
      }

      return newObj;
    }, {});
  }
  /**
   * Concatenates arrays to return the concatenated array.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */

  function $concatArrays(obj, expr) {
    var arr = computeValue(obj, expr, null);
    assert(isArray(arr), '$concatArrays must resolve to an array');
    if (arr.some(isNil)) return null;
    return arr.reduce(function (acc, item) {
      return into(acc, item);
    }, []);
  }
  /**
   * Selects a subset of the array to return an array with only the elements that match the filter condition.
   *
   * @param  {Object} obj  [description]
   * @param  {*} expr [description]
   * @return {*}      [description]
   */

  function $filter(obj, expr) {
    var input = computeValue(obj, expr.input);
    var asVar = expr['as'];
    var condExpr = expr['cond'];
    assert(isArray(input), "$filter 'input' expression must resolve to an array");
    return input.filter(function (o) {
      // inject variable
      var tempObj = {};
      tempObj['$' + asVar] = o;
      return computeValue(tempObj, condExpr) === true;
    });
  }
  /**
   * Returns a boolean indicating whether a specified value is in an array.
   *
   * @param {Object} obj
   * @param {Array} expr
   */

  function $in(obj, expr) {
    var val = computeValue(obj, expr[0]);
    var arr = computeValue(obj, expr[1]);
    assert(isArray(arr), '$in second argument must be an array');
    return arr.some(isEqual.bind(null, val));
  }
  /**
   * Searches an array for an occurrence of a specified value and returns the array index of the first occurrence.
   * If the substring is not found, returns -1.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */

  function $indexOfArray(obj, expr) {
    var args = computeValue(obj, expr);
    if (isNil(args)) return null;
    var arr = args[0];
    var searchValue = args[1];
    if (isNil(arr)) return null;
    assert(isArray(arr), '$indexOfArray expression must resolve to an array.');
    var start = args[2] || 0;
    var end = args[3];
    if (isNil(end)) end = arr.length;
    if (start > end) return -1;
    assert(start >= 0 && end >= 0, '$indexOfArray expression is invalid');

    if (start > 0 || end < arr.length) {
      arr = arr.slice(start, end);
    }

    return arr.findIndex(isEqual.bind(null, searchValue)) + start;
  }
  /**
   * Determines if the operand is an array. Returns a boolean.
   *
   * @param  {Object}  obj
   * @param  {*}  expr
   * @return {Boolean}
   */

  function $isArray(obj, expr) {
    return isArray(computeValue(obj, expr[0]));
  }
  /**
   * Applies a sub-expression to each element of an array and returns the array of resulting values in order.
   *
   * @param obj
   * @param expr
   * @returns {Array|*}
   */

  function $map(obj, expr) {
    var inputExpr = computeValue(obj, expr.input);
    assert(isArray(inputExpr), "$map 'input' expression must resolve to an array");
    var asExpr = expr['as'];
    var inExpr = expr['in']; // HACK: add the "as" expression as a value on the object to take advantage of "resolve()"
    // which will reduce to that value when invoked. The reference to the as expression will be prefixed with "$$".
    // But since a "$" is stripped of before passing the name to "resolve()" we just need to prepend "$" to the key.

    var tempKey = '$' + asExpr;
    return inputExpr.map(function (item) {
      obj[tempKey] = item;
      return computeValue(obj, inExpr);
    });
  }
  /**
   * Converts a document to an array of documents representing key-value pairs.
   */

  function $objectToArray(obj, expr) {
    var val = computeValue(obj, expr);
    assert(isObject(val), '$objectToArray expression must resolve to an object');
    var arr = [];
    each(val, function (v, k) {
      return arr.push({
        k: k,
        v: v
      });
    });
    return arr;
  }
  /**
   * Returns an array whose elements are a generated sequence of numbers.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */

  function $range(obj, expr) {
    var arr = computeValue(obj, expr);
    var start = arr[0];
    var end = arr[1];
    var step = arr[2] || 1;
    var result = [];

    while (start < end && step > 0 || start > end && step < 0) {
      result.push(start);
      start += step;
    }

    return result;
  }
  /**
   * Applies an expression to each element in an array and combines them into a single value.
   *
   * @param {Object} obj
   * @param {*} expr
   */

  function $reduce(obj, expr) {
    var input = computeValue(obj, expr.input);
    var initialValue = computeValue(obj, expr.initialValue);
    var inExpr = expr['in'];
    if (isNil(input)) return null;
    assert(isArray(input), "$reduce 'input' expression must resolve to an array");
    return reduce(input, function (acc, n) {
      return computeValue({
        '$value': acc,
        '$this': n
      }, inExpr);
    }, initialValue);
  }
  /**
   * Returns an array with the elements in reverse order.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */

  function $reverseArray(obj, expr) {
    var arr = computeValue(obj, expr);
    if (isNil(arr)) return null;
    assert(isArray(arr), '$reverseArray expression must resolve to an array');
    var result = [];
    into(result, arr);
    result.reverse();
    return result;
  }
  /**
   * Counts and returns the total the number of items in an array.
   *
   * @param obj
   * @param expr
   */

  function $size(obj, expr) {
    var value = computeValue(obj, expr);
    return isArray(value) ? value.length : undefined;
  }
  /**
   * Returns a subset of an array.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */

  function $slice(obj, expr) {
    var arr = computeValue(obj, expr);
    return slice(arr[0], arr[1], arr[2]);
  }
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

  function $zip(obj, expr) {
    var inputs = computeValue(obj, expr.inputs);
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

    var _loop = function _loop(_i) {
      var temp = inputs.map(function (val, index) {
        return isNil(val[_i]) ? defaults[index] || null : val[_i];
      });
      result.push(temp);
    };

    for (var _i = 0; _i < zipCount; _i++) {
      _loop(_i);
    }

    return result;
  }
  /**
   * Combines multiple documents into a single document.
   * @param {*} obj
   * @param {*} expr
   */

  function $mergeObjects(obj, expr) {
    var docs = computeValue(obj, expr);

    if (isArray(docs)) {
      return reduce(docs, function (memo, o) {
        return Object.assign(memo, o);
      }, {});
    }

    return {};
  }

  /**
   * Returns true only when all its expressions evaluate to true. Accepts any number of argument expressions.
   *
   * @param obj
   * @param expr
   * @returns {boolean}
   */

  function $and(obj, expr) {
    var value = computeValue(obj, expr);
    return truthy(value) && value.every(truthy);
  }
  /**
   * Returns true when any of its expressions evaluates to true. Accepts any number of argument expressions.
   *
   * @param obj
   * @param expr
   * @returns {boolean}
   */

  function $or(obj, expr) {
    var value = computeValue(obj, expr);
    return truthy(value) && value.some(truthy);
  }
  /**
   * Returns the boolean value that is the opposite of its argument expression. Accepts a single argument expression.
   *
   * @param obj
   * @param expr
   * @returns {boolean}
   */

  function $not(obj, expr) {
    return !computeValue(obj, expr[0]);
  }

  /**
   * Returns an iterator
   * @param {*} source An iterable source (Array, Function, Object{next:Function})
   */
  function Lazy(source) {
    return source instanceof Iterator ? source : new Iterator(source);
  }
  Lazy.isIterator = isIterator;
  /**
   * Checks whether the given object is compatible with iterator i.e Object{next:Function}
   * @param {*} o An object
   */

  function isIterator(o) {
    return !!o && _typeof(o) === 'object' && isFn(o.next);
  }

  function isFn(f) {
    return !!f && typeof f === 'function';
  }

  function dropItem(array, i) {
    var rest = array.slice(i + 1);
    array.splice(i);
    Array.prototype.push.apply(array, rest);
  } // stop iteration error


  var DONE = new Error(); // Lazy function type flags

  var LAZY_MAP = 1;
  var LAZY_FILTER = 2;
  var LAZY_TAKE = 3;
  var LAZY_DROP = 4;

  function baseIterator(nextFn, iteratees, buffer) {
    var done = false;
    var index = -1;

    var bIndex = 0; // index for the buffer

    return function (b) {
      // special hack to collect all values into buffer
      b = b === buffer;

      try {
        outer: while (!done) {
          var o = nextFn();
          index++;
          var mIndex = -1;
          var mSize = iteratees.length;
          var innerDone = false;

          while (++mIndex < mSize) {
            var member = iteratees[mIndex],
                func = member.func,
                type = member.type;

            switch (type) {
              case LAZY_MAP:
                o = func(o, index);
                break;

              case LAZY_FILTER:
                if (!func(o, index)) continue outer;
                break;

              case LAZY_TAKE:
                --member.func;
                if (!member.func) innerDone = true;
                break;

              case LAZY_DROP:
                --member.func;
                if (!member.func) dropItem(iteratees, mIndex);
                continue outer;

              default:
                break outer;
            }
          }

          done = innerDone;

          if (b) {
            buffer[bIndex++] = o;
          } else {
            return {
              value: o,
              done: false
            };
          }
        }
      } catch (e) {
        if (e !== DONE) throw e;
      }

      done = true;
      return {
        done: true
      };
    };
  }

  var Iterator = /*#__PURE__*/function () {
    /**
     * @param {*} source An iterable object or function.
     *    Array - return one element per cycle
     *    Object{next:Function} - call next() for the next value (this also handles generator functions)
     *    Function - call to return the next value
     * @param {Function} fn An optional transformation function
     */
    function Iterator(source) {
      _classCallCheck(this, Iterator);

      this.__iteratees = []; // lazy function chain

      this.__first = false; // flag whether to return a single value

      this.__done = false;
      this.__buf = [];

      if (isFn(source)) {
        // make iterable
        source = {
          next: source
        };
      }

      if (isIterator(source)) {
        var src = source;

        source = function source() {
          var o = src.next();
          if (o.done) throw DONE;
          return o.value;
        };
      } else if (Array.isArray(source)) {
        var data = source;
        var size = data.length;
        var index = 0;

        source = function source() {
          if (index < size) return data[index++];
          throw DONE;
        };
      } else if (!isFn(source)) {
        throw new Error("Source is not iterable. Must be Array, Function or Object{next:Function}");
      } // create next function


      this.next = baseIterator(source, this.__iteratees, this.__buf);
    }

    _createClass(Iterator, [{
      key: "_validate",
      value: function _validate() {
        if (this.__first) throw new Error("Cannot add iteratee/transform after `first()`");
      }
      /**
       * Add an iteratee to this lazy sequence
       * @param {Object} iteratee
       */

    }, {
      key: "_push",
      value: function _push(iteratee) {
        this._validate();

        this.__iteratees.push(iteratee);

        return this;
      } // Iteratees methods

      /**
       * Transform each item in the sequence to a new value
       * @param {Function} f
       */

    }, {
      key: "map",
      value: function map(f) {
        return this._push({
          type: LAZY_MAP,
          func: f
        });
      }
      /**
       * Select only items matching the given predicate
       * @param {Function} pred
       */

    }, {
      key: "filter",
      value: function filter(pred) {
        return this._push({
          type: LAZY_FILTER,
          func: pred
        });
      }
      /**
       * Take given numbe for values from sequence
       * @param {Number} n A number greater than 0
       */

    }, {
      key: "take",
      value: function take(n) {
        return n > 0 ? this._push({
          type: LAZY_TAKE,
          func: n
        }) : this;
      }
      /**
       * Drop a number of values from the sequence
       * @param {Number} n Number of items to drop greater than 0
       */

    }, {
      key: "drop",
      value: function drop(n) {
        return n > 0 ? this._push({
          type: LAZY_DROP,
          func: n
        }) : this;
      } // Transformations

      /**
       * Returns a new lazy object with results of the transformation
       * The entire sequence is realized.
       *
       * @param {Function} fn Tranform function of type (Array) => (Any)
       */

    }, {
      key: "transform",
      value: function transform(fn) {
        this._validate();

        var self = this;
        var iter;
        return Lazy(function () {
          if (!iter) {
            iter = Lazy(fn(self.value()));
          }

          return iter.next();
        });
      }
      /**
       * Mark this lazy object to return only the first result on `lazy.value()`.
       * No more iteratees or transformations can be added after this method is called.
       */

    }, {
      key: "first",
      value: function first() {
        this.take(1);
        this.__first = true;
        return this;
      } // Terminal methods

      /**
       * Returns the fully realized values of the iterators.
       * The return value will be an array unless `lazy.first()` was used.
       * The realized values are cached for subsequent calls
       */

    }, {
      key: "value",
      value: function value() {
        if (!this.__done) {
          this.__done = this.next(this.__buf).done;
        }

        return this.__first ? this.__buf[0] : this.__buf;
      }
      /**
       * Execute the funcion for each value. Will stop when an execution returns false.
       * @param {Function} f
       * @returns {Boolean} false iff `f` return false for any execution, otherwise true
       */

    }, {
      key: "each",
      value: function each(f) {
        while (1) {
          var o = this.next();
          if (o.done) break;
          if (f(o.value) === false) return false;
        }

        return true;
      }
      /**
       * Returns the reduction of sequence according the reducing function
       *
       * @param {*} f a reducing function
       * @param {*} init
       */

    }, {
      key: "reduce",
      value: function reduce(f, init) {
        var o = this.next();
        var i = 0;

        if (init === undefined && !o.done) {
          init = o.value;
          o = this.next();
          i++;
        }

        while (!o.done) {
          init = f(init, o.value, i++);
          o = this.next();
        }

        return init;
      }
      /**
       * Returns the number of matched items in the sequence
       */

    }, {
      key: "size",
      value: function size() {
        return this.reduce(function (acc, n) {
          return ++acc;
        }, 0);
      }
    }]);

    return Iterator;
  }();

  if (typeof Symbol === 'function') {
    Iterator.prototype[Symbol.iterator] = function () {
      return this;
    };
  }

  /**
   * Aggregator for defining filter using mongoDB aggregation pipeline syntax
   *
   * @param operators an Array of pipeline operators
   * @constructor
   */

  var Aggregator = /*#__PURE__*/function () {
    function Aggregator(operators, options) {
      _classCallCheck(this, Aggregator);

      this.__operators = operators;
      this.__options = options;
    }
    /**
     * Returns an `Lazy` iterator for processing results of pipeline
     *
     * @param {*} collection An array or iterator object
     * @param {Query} query the `Query` object to use as context
     * @returns {Iterator} an iterator object
     */


    _createClass(Aggregator, [{
      key: "stream",
      value: function stream(collection, query) {
        var _this = this;

        collection = Lazy(collection);
        var pipelineOperators = OPERATORS[OP_PIPELINE];

        if (!isEmpty(this.__operators)) {
          // run aggregation pipeline
          each(this.__operators, function (operator) {
            var key = keys(operator);
            assert(key.length === 1 && inArray(ops(OP_PIPELINE), key[0]), "invalid aggregation operator ".concat(key));
            key = key[0];

            if (query && query instanceof Query) {
              collection = pipelineOperators[key].call(query, collection, operator[key], _this.__options);
            } else {
              collection = pipelineOperators[key](collection, operator[key], _this.__options);
            }
          });
        }

        return collection;
      }
      /**
       * Return the results of the aggregation as an array.
       * @param {*} collection
       * @param {*} query
       */

    }, {
      key: "run",
      value: function run(collection, query) {
        return this.stream(collection, query).value();
      }
    }]);

    return Aggregator;
  }();
  /**
   * Return the result collection after running the aggregation pipeline for the given collection.
   * Shorthand for `(new Aggregator(pipeline, options)).run(collection)`
   *
   * @param {Array} collection Collection or stream of objects
   * @param {Array} pipeline The pipeline operators to use
   * @returns {Array}
   */

  function aggregate(collection, pipeline, options) {
    assert(isArray(pipeline), 'Aggregation pipeline must be an array');
    return new Aggregator(pipeline, options).run(collection);
  }

  /**
   * Cursor to iterate and perform filtering on matched objects
   * @param collection
   * @param query
   * @param projection
   * @constructor
   */

  var Cursor = /*#__PURE__*/function () {
    function Cursor(source, query, projection) {
      _classCallCheck(this, Cursor);

      this.__filterFn = query.test.bind(query);
      this.__query = query;
      this.__source = source;
      this.__projection = projection || query.__projection;
      this.__operators = [];
      this.__result = null;
      this.__stack = [];
      this.__options = {};
    }

    _createClass(Cursor, [{
      key: "_fetch",
      value: function _fetch() {
        if (!!this.__result) return this.__result; // add projection operator

        if (isObject(this.__projection)) this.__operators.push({
          '$project': this.__projection
        }); // filter collection

        this.__result = Lazy(this.__source).filter(this.__filterFn);

        if (this.__operators.length > 0) {
          this.__result = new Aggregator(this.__operators, this.__options).stream(this.__result, this.__query);
        }

        return this.__result;
      }
      /**
       * Return remaining objects in the cursor as an array. This method exhausts the cursor
       * @returns {Array}
       */

    }, {
      key: "all",
      value: function all() {
        return this._fetch().value();
      }
      /**
       * Returns the number of objects return in the cursor. This method exhausts the cursor
       * @returns {Number}
       */

    }, {
      key: "count",
      value: function count() {
        return this.all().length;
      }
      /**
       * Returns a cursor that begins returning results only after passing or skipping a number of documents.
       * @param {Number} n the number of results to skip.
       * @return {Cursor} Returns the cursor, so you can chain this call.
       */

    }, {
      key: "skip",
      value: function skip(n) {
        this.__operators.push({
          '$skip': n
        });

        return this;
      }
      /**
       * Constrains the size of a cursor's result set.
       * @param {Number} n the number of results to limit to.
       * @return {Cursor} Returns the cursor, so you can chain this call.
       */

    }, {
      key: "limit",
      value: function limit(n) {
        this.__operators.push({
          '$limit': n
        });

        return this;
      }
      /**
       * Returns results ordered according to a sort specification.
       * @param {Object} modifier an object of key and values specifying the sort order. 1 for ascending and -1 for descending
       * @return {Cursor} Returns the cursor, so you can chain this call.
       */

    }, {
      key: "sort",
      value: function sort(modifier) {
        this.__operators.push({
          '$sort': modifier
        });

        return this;
      }
      /**
       * Specifies the collation for the cursor returned by the `mingo.Query.find`
       * @param {*} options
       */

    }, {
      key: "collation",
      value: function collation(options) {
        this.__options['collation'] = options;
        return this;
      }
      /**
       * Returns the next document in a cursor.
       * @returns {Object | Boolean}
       */

    }, {
      key: "next",
      value: function next() {
        if (!this.__stack) return; // done

        if (this.__stack.length > 0) return this.__stack.pop(); // yield value obtains in hasNext()

        var o = this._fetch().next();

        if (!o.done) return o.value;
        this.__stack = null;
        return;
      }
      /**
       * Returns true if the cursor has documents and can be iterated.
       * @returns {boolean}
       */

    }, {
      key: "hasNext",
      value: function hasNext() {
        if (!this.__stack) return false; // done

        if (this.__stack.length > 0) return true; // there is a value on stack

        var o = this._fetch().next();

        if (!o.done) {
          this.__stack.push(o.value);
        } else {
          this.__stack = null;
        }

        return !!this.__stack;
      }
      /**
       * Applies a function to each document in a cursor and collects the return values in an array.
       * @param callback
       * @returns {Array}
       */

    }, {
      key: "map",
      value: function map(callback) {
        return this._fetch().map(callback).value();
      }
      /**
       * Applies a JavaScript function for every document in a cursor.
       * @param callback
       */

    }, {
      key: "forEach",
      value: function forEach(callback) {
        this._fetch().each(callback);
      }
    }]);

    return Cursor;
  }();

  if (typeof Symbol === 'function') {
    /**
     * Applies an [ES2015 Iteration protocol][] compatible implementation
     * [ES2015 Iteration protocol]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
     * @returns {Object}
     */
    Cursor.prototype[Symbol.iterator] = function () {
      return this._fetch();
    };
  }

  /**
   * Query object to test collection elements with
   * @param criteria the pass criteria for the query
   * @param projection optional projection specifiers
   * @constructor
   */

  var Query = /*#__PURE__*/function () {
    function Query(criteria, projection) {
      _classCallCheck(this, Query);

      this.__criteria = criteria;
      this.__projection = projection || {};
      this.__compiled = [];

      this._compile();
    }

    _createClass(Query, [{
      key: "_compile",
      value: function _compile() {
        var _this = this;

        assert(isObject(this.__criteria), 'query criteria must be an object');
        var whereOperator;
        each(this.__criteria, function (expr, field) {
          // save $where operators to be executed after other operators
          if ('$where' === field) {
            whereOperator = {
              field: field,
              expr: expr
            };
          } else if ('$expr' === field) {
            _this._processOperator(field, field, expr);
          } else if (inArray(['$and', '$or', '$nor'], field)) {
            _this._processOperator(field, field, expr);
          } else {
            // normalize expression
            assert(!isOperator(field), "unknown top level operator: ".concat(field));
            expr = normalize(expr);
            each(expr, function (val, op) {
              _this._processOperator(field, op, val);
            });
          }

          if (isObject(whereOperator)) {
            _this._processOperator(whereOperator.field, whereOperator.field, whereOperator.expr);
          }
        });
      }
    }, {
      key: "_processOperator",
      value: function _processOperator(field, operator, value) {
        assert(has(OPERATORS[OP_QUERY], operator), "invalid query operator ".concat(operator, " detected"));

        this.__compiled.push(OPERATORS[OP_QUERY][operator](field, value));
      }
      /**
       * Checks if the object passes the query criteria. Returns true if so, false otherwise.
       * @param obj
       * @returns {boolean}
       */

    }, {
      key: "test",
      value: function test(obj) {
        for (var i = 0, len = this.__compiled.length; i < len; i++) {
          if (!this.__compiled[i](obj)) {
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
      key: "find",
      value: function find(collection, projection) {
        return new Cursor(collection, this, projection);
      }
      /**
       * Remove matched documents from the collection returning the remainder
       * @param collection
       * @returns {Array}
       */

    }, {
      key: "remove",
      value: function remove(collection) {
        var _this2 = this;

        return reduce(collection, function (acc, obj) {
          if (!_this2.test(obj)) acc.push(obj);
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
   * Query and Projection Operators. https://docs.mongodb.com/manual/reference/operator/query/
   */
  /**
   * Checks that two values are equal.
   *
   * @param a         The lhs operand as resolved from the object by the given selector
   * @param b         The rhs operand provided by the user
   * @returns {*}
   */

  function $eq(a, b) {
    // start with simple equality check
    if (isEqual(a, b)) return true; // https://docs.mongodb.com/manual/tutorial/query-for-null-fields/

    if (isNil(a) && isNil(b)) return true; // check

    if (isArray(a)) {
      var eq = isEqual.bind(null, b);
      return a.some(eq) || flatten(a, 1).some(eq);
    }

    return false;
  }
  /**
   * Matches all values that are not equal to the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */

  function $ne(a, b) {
    return !$eq(a, b);
  }
  /**
   * Matches any of the values that exist in an array specified in the query.
   *
   * @param a
   * @param b
   * @returns {*}
   */

  function $in$1(a, b) {
    // queries for null should be able to find undefined fields
    if (isNil(a)) return b.some(isNull);
    return intersection(ensureArray(a), b).length > 0;
  }
  /**
   * Matches values that do not exist in an array specified to the query.
   *
   * @param a
   * @param b
   * @returns {*|boolean}
   */

  function $nin(a, b) {
    return !$in$1(a, b);
  }
  /**
   * Matches values that are less than the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */

  function $lt(a, b) {
    return compare$1(a, b, function (x, y) {
      return x < y;
    });
  }
  /**
   * Matches values that are less than or equal to the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */

  function $lte(a, b) {
    return compare$1(a, b, function (x, y) {
      return x <= y;
    });
  }
  /**
   * Matches values that are greater than the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */

  function $gt(a, b) {
    return compare$1(a, b, function (x, y) {
      return x > y;
    });
  }
  /**
   * Matches values that are greater than or equal to the value specified in the query.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */

  function $gte(a, b) {
    return compare$1(a, b, function (x, y) {
      return x >= y;
    });
  }
  /**
   * Performs a modulo operation on the value of a field and selects documents with a specified result.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */

  function $mod$1(a, b) {
    return ensureArray(a).some(function (x) {
      return isNumber(x) && isArray(b) && b.length === 2 && x % b[0] === b[1];
    });
  }
  /**
   * Selects documents where values match a specified regular expression.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */

  function $regex(a, b) {
    a = ensureArray(a);

    var match = function match(x) {
      return isString(x) && !!x.match(b);
    };

    return a.some(match) || flatten(a, 1).some(match);
  }
  /**
   * Matches documents that have the specified field.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */

  function $exists(a, b) {
    return (b === false || b === 0) && a === undefined || (b === true || b === 1) && a !== undefined;
  }
  /**
   * Matches arrays that contain all elements specified in the query.
   *
   * @param a
   * @param b
   * @returns boolean
   */

  function $all(a, b) {
    var matched = false;

    if (isArray(a) && isArray(b)) {
      for (var i = 0, len = b.length; i < len; i++) {
        if (isObject(b[i]) && inArray(keys(b[i]), '$elemMatch')) {
          matched = matched || $elemMatch(a, b[i].$elemMatch);
        } else {
          // order of arguments matter
          return intersection(b, a).length === len;
        }
      }
    }

    return matched;
  }
  /**
   * Selects documents if the array field is a specified size.
   *
   * @param a
   * @param b
   * @returns {*|boolean}
   */

  function $size$1(a, b) {
    return isArray(a) && isNumber(b) && a.length === b;
  }
  /**
   * Selects documents if element in the array field matches all the specified $elemMatch condition.
   *
   * @param a {Array} element to match against
   * @param b {Object} subquery
   */

  function $elemMatch(a, b) {
    if (isArray(a) && !isEmpty(a)) {
      var format = function format(x) {
        return x;
      };

      var criteria = b; // If we find an operator in the subquery, we fake a field to point to it.
      // This is an attempt to ensure that it a valid criteria.

      if (keys(b).every(isOperator)) {
        criteria = {
          temp: b
        };

        format = function format(x) {
          return {
            temp: x
          };
        };
      }

      var query = new Query(criteria);

      for (var i = 0, len = a.length; i < len; i++) {
        if (query.test(format(a[i]))) {
          return true;
        }
      }
    }

    return false;
  }
  /**
   * Selects documents if a field is of the specified type.
   *
   * @param a
   * @param b
   * @returns {boolean}
   */

  function $type(a, b) {
    switch (b) {
      case 1:
      case 'double':
        return isNumber(a) && (a + '').indexOf('.') !== -1;

      case 2:
      case T_STRING:
        return isString(a);

      case 3:
      case T_OBJECT:
        return isObject(a);

      case 4:
      case T_ARRAY:
        return isArray(a);

      case 6:
      case T_UNDEFINED:
        return isNil(a);

      case 8:
      case T_BOOL:
        return isBoolean(a);

      case 9:
      case T_DATE:
        return isDate(a);

      case 10:
      case T_NULL:
        return isNull(a);

      case 11:
      case T_REGEX:
        return isRegExp(a);

      case 16:
      case 'int':
        return isNumber(a) && a <= 2147483647 && (a + '').indexOf('.') === -1;

      case 18:
      case 'long':
        return isNumber(a) && a > 2147483647 && a <= 9223372036854775807 && (a + '').indexOf('.') === -1;

      case 19:
      case 'decimal':
        return isNumber(a);

      default:
        return false;
    }
  }

  function compare$1(a, b, f) {
    return ensureArray(a).some(function (x) {
      return getType(x) === getType(b) && f(x, b);
    });
  }

  function createComparison(f) {
    return function (obj, expr) {
      var args = computeValue(obj, expr);
      return f(args[0], args[1]);
    };
  }

  var $eq$1 = createComparison($eq);
  var $ne$1 = createComparison($ne);
  var $gt$1 = createComparison($gt);
  var $lt$1 = createComparison($lt);
  var $gte$1 = createComparison($gte);
  var $lte$1 = createComparison($lte);
  var $nin$1 = createComparison($nin);
  /**
   * Compares two values and returns the result of the comparison as an integer.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $cmp(obj, expr) {
    var args = computeValue(obj, expr);
    if (args[0] > args[1]) return 1;
    if (args[0] < args[1]) return -1;
    return 0;
  }

  /**
   * Conditional operators
   */
  /**
   * A ternary operator that evaluates one expression,
   * and depending on the result returns the value of one following expressions.
   *
   * @param obj
   * @param expr
   */

  function $cond(obj, expr) {
    var ifExpr, thenExpr, elseExpr;
    var errorMsg = '$cond: invalid arguments';

    if (isArray(expr)) {
      assert(expr.length === 3, errorMsg);
      ifExpr = expr[0];
      thenExpr = expr[1];
      elseExpr = expr[2];
    } else {
      assert(isObject(expr), errorMsg);
      ifExpr = expr['if'];
      thenExpr = expr['then'];
      elseExpr = expr['else'];
    }

    var condition = computeValue(obj, ifExpr);
    return condition ? computeValue(obj, thenExpr) : computeValue(obj, elseExpr);
  }
  /**
   * An operator that evaluates a series of case expressions. When it finds an expression which
   * evaluates to true, it returns the resulting expression for that case. If none of the cases
   * evaluate to true, it returns the default expression.
   *
   * @param obj
   * @param expr
   */

  function $switch(obj, expr) {
    var errorMsg = 'Invalid arguments for $switch operator';
    assert(expr.branches, errorMsg);
    var validBranch = expr.branches.find(function (branch) {
      assert(branch['case'] && branch['then'], errorMsg);
      return computeValue(obj, branch['case']);
    });

    if (validBranch) {
      return computeValue(obj, validBranch.then);
    } else {
      assert(expr['default'], errorMsg);
      return computeValue(obj, expr["default"]);
    }
  }
  /**
   * Evaluates an expression and returns the first expression if it evaluates to a non-null value.
   * Otherwise, $ifNull returns the second expression's value.
   *
   * @param obj
   * @param expr
   * @returns {*}
   */

  function $ifNull(obj, expr) {
    assert(isArray(expr) && expr.length === 2, '$ifNull expression must resolve to array(2)');
    var args = computeValue(obj, expr);
    return isNil(args[0]) ? args[1] : args[0];
  }

  /**
   * Returns the day of the year for a date as a number between 1 and 366 (leap year).
   * @param obj
   * @param expr
   */

  function $dayOfYear(obj, expr) {
    var d = computeValue(obj, expr);
    var start = new Date(d.getFullYear(), 0, 0);
    var diff = d - start;
    var oneDay = 1000 * 60 * 60 * 24;
    return Math.round(diff / oneDay);
  }
  /**
   * Returns the day of the month for a date as a number between 1 and 31.
   * @param obj
   * @param expr
   */

  function $dayOfMonth(obj, expr) {
    var d = computeValue(obj, expr);
    return d.getDate();
  }
  /**
   * Returns the day of the week for a date as a number between 1 (Sunday) and 7 (Saturday).
   * @param obj
   * @param expr
   */

  function $dayOfWeek(obj, expr) {
    var d = computeValue(obj, expr);
    return d.getDay() + 1;
  }
  /**
   * Returns the year for a date as a number (e.g. 2014).
   * @param obj
   * @param expr
   */

  function $year(obj, expr) {
    var d = computeValue(obj, expr);
    return d.getFullYear();
  }
  /**
   * Returns the month for a date as a number between 1 (January) and 12 (December).
   * @param obj
   * @param expr
   */

  function $month(obj, expr) {
    var d = computeValue(obj, expr);
    return d.getMonth() + 1;
  }
  /**
   * Returns the week number for a date as a number between 0
   * (the partial week that precedes the first Sunday of the year) and 53 (leap year).
   * @param obj
   * @param expr
   */

  function $week(obj, expr) {
    // source: http://stackoverflow.com/a/6117889/1370481
    var d = computeValue(obj, expr); // Copy date so don't modify original

    d = new Date(+d);
    d.setHours(0, 0, 0); // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7

    d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Get first day of year

    var yearStart = new Date(d.getFullYear(), 0, 1); // Calculate full weeks to nearest Thursday

    return Math.floor(((d - yearStart) / 8.64e7 + 1) / 7);
  }
  /**
   * Returns the hour for a date as a number between 0 and 23.
   * @param obj
   * @param expr
   */

  function $hour(obj, expr) {
    var d = computeValue(obj, expr);
    return d.getUTCHours();
  }
  /**
   * Returns the minute for a date as a number between 0 and 59.
   * @param obj
   * @param expr
   */

  function $minute(obj, expr) {
    var d = computeValue(obj, expr);
    return d.getMinutes();
  }
  /**
   * Returns the seconds for a date as a number between 0 and 60 (leap seconds).
   * @param obj
   * @param expr
   */

  function $second(obj, expr) {
    var d = computeValue(obj, expr);
    return d.getSeconds();
  }
  /**
   * Returns the milliseconds of a date as a number between 0 and 999.
   * @param obj
   * @param expr
   */

  function $millisecond(obj, expr) {
    var d = computeValue(obj, expr);
    return d.getMilliseconds();
  } // used for formatting dates in $dateToString operator

  var DATE_SYM_TABLE = {
    '%Y': [$year, 4],
    '%m': [$month, 2],
    '%d': [$dayOfMonth, 2],
    '%H': [$hour, 2],
    '%M': [$minute, 2],
    '%S': [$second, 2],
    '%L': [$millisecond, 3],
    '%j': [$dayOfYear, 3],
    '%w': [$dayOfWeek, 1],
    '%U': [$week, 2],
    '%%': '%'
  };
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

  function $dateToString(obj, expr) {
    var fmt = expr['format'];
    var date = computeValue(obj, expr['date']);
    var matches = fmt.match(/(%%|%Y|%m|%d|%H|%M|%S|%L|%j|%w|%U)/g);

    for (var i = 0, len = matches.length; i < len; i++) {
      var hdlr = DATE_SYM_TABLE[matches[i]];
      var value = hdlr;

      if (isArray(hdlr)) {
        // reuse date operators
        var fn = hdlr[0];
        var pad = hdlr[1];
        value = padDigits(fn(obj, date), pad);
      } // replace the match with resolved value


      fmt = fmt.replace(matches[i], value);
    }

    return fmt;
  }

  function padDigits(number, digits) {
    return new Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
  }

  /**
   * Return a value without parsing.
   * @param obj
   * @param expr
   */
  function $literal(obj, expr) {
    return expr;
  }

  /**
   * Returns true if two sets have the same elements.
   * @param obj
   * @param expr
   */

  function $setEquals(obj, expr) {
    var args = computeValue(obj, expr);
    var xs = unique(args[0]);
    var ys = unique(args[1]);
    return xs.length === ys.length && xs.length === intersection(xs, ys).length;
  }
  /**
   * Returns the common elements of the input sets.
   * @param obj
   * @param expr
   */

  function $setIntersection(obj, expr) {
    var args = computeValue(obj, expr);
    return intersection(args[0], args[1]);
  }
  /**
   * Returns elements of a set that do not appear in a second set.
   * @param obj
   * @param expr
   */

  function $setDifference(obj, expr) {
    var args = computeValue(obj, expr);
    return args[0].filter(notInArray.bind(null, args[1]));
  }
  /**
   * Returns a set that holds all elements of the input sets.
   * @param obj
   * @param expr
   */

  function $setUnion(obj, expr) {
    var args = computeValue(obj, expr);
    return union(args[0], args[1]);
  }
  /**
   * Returns true if all elements of a set appear in a second set.
   * @param obj
   * @param expr
   */

  function $setIsSubset(obj, expr) {
    var args = computeValue(obj, expr);
    return intersection(args[0], args[1]).length === args[0].length;
  }
  /**
   * Returns true if any elements of a set evaluate to true, and false otherwise.
   * @param obj
   * @param expr
   */

  function $anyElementTrue(obj, expr) {
    // mongodb nests the array expression in another
    var args = computeValue(obj, expr)[0];
    return args.some(truthy);
  }
  /**
   * Returns true if all elements of a set evaluate to true, and false otherwise.
   * @param obj
   * @param expr
   */

  function $allElementsTrue(obj, expr) {
    // mongodb nests the array expression in another
    var args = computeValue(obj, expr)[0];
    return args.every(truthy);
  }

  /**
   * Concatenates two strings.
   *
   * @param obj
   * @param expr
   * @returns {string|*}
   */

  function $concat(obj, expr) {
    var args = computeValue(obj, expr); // does not allow concatenation with nulls

    if ([null, undefined].some(inArray.bind(null, args))) return null;
    return args.join('');
  }
  /**
   * Searches a string for an occurrence of a substring and returns the UTF-8 code point index of the first occurence.
   * If the substring is not found, returns -1.
   *
   * @param  {Object} obj
   * @param  {*} expr
   * @return {*}
   */

  function $indexOfBytes(obj, expr) {
    var arr = computeValue(obj, expr);
    var errorMsg = '$indexOfBytes expression resolves to invalid an argument';
    if (isNil(arr[0])) return null;
    assert(isString(arr[0]) && isString(arr[1]), errorMsg);
    var str = arr[0];
    var searchStr = arr[1];
    var start = arr[2];
    var end = arr[3];
    var valid = isNil(start) || isNumber(start) && start >= 0 && Math.round(start) === start;
    valid = valid && (isNil(end) || isNumber(end) && end >= 0 && Math.round(end) === end);
    assert(valid, errorMsg);
    start = start || 0;
    end = end || str.length;
    if (start > end) return -1;
    var index = str.substring(start, end).indexOf(searchStr);
    return index > -1 ? index + start : index;
  }
  /**
   * Splits a string into substrings based on a delimiter.
   * If the delimiter is not found within the string, returns an array containing the original string.
   *
   * @param  {Object} obj
   * @param  {Array} expr
   * @return {Array} Returns an array of substrings.
   */

  function $split(obj, expr) {
    var args = computeValue(obj, expr);
    if (isNil(args[0])) return null;
    assert(args.every(isString), '$split expression must result to array(2) of strings');
    return args[0].split(args[1]);
  }
  /**
   * Returns the number of UTF-8 encoded bytes in the specified string.
   *
   * @param  {Object} obj
   * @param  {String} expr
   * @return {Number}
   */

  function $strLenBytes(obj, expr) {
    return ~-encodeURI(computeValue(obj, expr)).split(/%..|./).length;
  }
  /**
   * Returns the number of UTF-8 code points in the specified string.
   *
   * @param  {Object} obj
   * @param  {String} expr
   * @return {Number}
   */

  function $strLenCP(obj, expr) {
    return computeValue(obj, expr).length;
  }
  /**
   * Compares two strings and returns an integer that reflects the comparison.
   *
   * @param obj
   * @param expr
   * @returns {number}
   */

  function $strcasecmp(obj, expr) {
    var args = computeValue(obj, expr);
    var a = args[0];
    var b = args[1];
    if (isEqual(a, b) || args.every(isNil)) return 0;
    assert(args.every(isString), '$strcasecmp must resolve to array(2) of strings');
    a = a.toUpperCase();
    b = b.toUpperCase();
    return a > b && 1 || a < b && -1 || 0;
  }
  /**
   * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
   * The index is zero-based.
   *
   * @param obj
   * @param expr
   * @returns {string}
   */

  function $substrBytes(obj, expr) {
    var args = computeValue(obj, expr);
    var s = args[0];
    var index = args[1];
    var count = args[2];
    assert(isString(s) && isNumber(index) && index >= 0 && isNumber(count) && count >= 0, '$substrBytes: invalid arguments');
    var buf = utf8Encode(s);
    var validIndex = [];
    var acc = 0;

    for (var i = 0; i < buf.length; i++) {
      validIndex.push(acc);
      acc += buf[i].length;
    }

    var begin = validIndex.indexOf(index);
    var end = validIndex.indexOf(index + count);
    assert(begin > -1 && end > -1, '$substrBytes: invalid range, start or end index is a UTF-8 continuation byte.');
    return s.substring(begin, end);
  }
  /**
   * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
   * The index is zero-based.
   *
   * @param obj
   * @param expr
   * @returns {string}
   */

  function $substr(obj, expr) {
    var args = computeValue(obj, expr);
    var s = args[0];
    var index = args[1];
    var count = args[2];

    if (isString(s)) {
      if (index < 0) {
        return '';
      } else if (count < 0) {
        return s.substr(index);
      } else {
        return s.substr(index, count);
      }
    }

    return '';
  }
  function $substrCP(obj, expr) {
    return $substr(obj, expr);
  }
  /**
   * Converts a string to lowercase.
   *
   * @param obj
   * @param expr
   * @returns {string}
   */

  function $toLower(obj, expr) {
    var value = computeValue(obj, expr);
    return isEmpty(value) ? '' : value.toLowerCase();
  }
  /**
   * Converts a string to uppercase.
   *
   * @param obj
   * @param expr
   * @returns {string}
   */

  function $toUpper(obj, expr) {
    var value = computeValue(obj, expr);
    return isEmpty(value) ? '' : value.toUpperCase();
  }
  var UTF8_MASK = [0xC0, 0xE0, 0xF0]; // encodes a unicode code point to a utf8 byte sequence
  // https://encoding.spec.whatwg.org/#utf-8

  function toUtf8(n) {
    if (n < 0x80) return [n];
    var count = n < 0x0800 && 1 || n < 0x10000 && 2 || 3;
    var offset = UTF8_MASK[count - 1];
    var utf8 = [(n >> 6 * count) + offset];

    while (count > 0) {
      utf8.push(0x80 | n >> 6 * --count & 0x3F);
    }

    return utf8;
  }

  function utf8Encode(s) {
    var buf = [];

    for (var i = 0, len = s.length; i < len; i++) {
      buf.push(toUtf8(s.codePointAt(i)));
    }

    return buf;
  }

  /**
   * Aggregation framework variable operators
   */
  /**
   * Defines variables for use within the scope of a sub-expression and returns the result of the sub-expression.
   *
   * @param obj
   * @param expr
   * @returns {*}
   */

  function $let(obj, expr) {
    var varsExpr = expr['vars'];
    var inExpr = expr['in']; // resolve vars

    var varsKeys = keys(varsExpr);
    each(varsKeys, function (key) {
      var val = computeValue(obj, varsExpr[key]);
      var tempKey = '$' + key;
      obj[tempKey] = val;
    });
    return computeValue(obj, inExpr);
  }

  var expressionOperators = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $abs: $abs,
    $add: $add,
    $ceil: $ceil,
    $divide: $divide,
    $exp: $exp,
    $floor: $floor,
    $ln: $ln,
    $log: $log,
    $log10: $log10,
    $mod: $mod,
    $multiply: $multiply,
    $pow: $pow,
    $round: $round,
    $sqrt: $sqrt,
    $subtract: $subtract,
    $trunc: $trunc,
    $arrayElemAt: $arrayElemAt,
    $arrayToObject: $arrayToObject,
    $concatArrays: $concatArrays,
    $filter: $filter,
    $in: $in,
    $indexOfArray: $indexOfArray,
    $isArray: $isArray,
    $map: $map,
    $objectToArray: $objectToArray,
    $range: $range,
    $reduce: $reduce,
    $reverseArray: $reverseArray,
    $size: $size,
    $slice: $slice,
    $zip: $zip,
    $mergeObjects: $mergeObjects,
    $and: $and,
    $or: $or,
    $not: $not,
    $eq: $eq$1,
    $ne: $ne$1,
    $gt: $gt$1,
    $lt: $lt$1,
    $gte: $gte$1,
    $lte: $lte$1,
    $nin: $nin$1,
    $cmp: $cmp,
    $cond: $cond,
    $switch: $switch,
    $ifNull: $ifNull,
    $dayOfYear: $dayOfYear,
    $dayOfMonth: $dayOfMonth,
    $dayOfWeek: $dayOfWeek,
    $year: $year,
    $month: $month,
    $week: $week,
    $hour: $hour,
    $minute: $minute,
    $second: $second,
    $millisecond: $millisecond,
    $dateToString: $dateToString,
    $literal: $literal,
    $setEquals: $setEquals,
    $setIntersection: $setIntersection,
    $setDifference: $setDifference,
    $setUnion: $setUnion,
    $setIsSubset: $setIsSubset,
    $anyElementTrue: $anyElementTrue,
    $allElementsTrue: $allElementsTrue,
    $concat: $concat,
    $indexOfBytes: $indexOfBytes,
    $split: $split,
    $strLenBytes: $strLenBytes,
    $strLenCP: $strLenCP,
    $strcasecmp: $strcasecmp,
    $substrBytes: $substrBytes,
    $substr: $substr,
    $substrCP: $substrCP,
    $toLower: $toLower,
    $toUpper: $toUpper,
    $let: $let
  });

  /**
   * Returns an array of all values for the selected field among for each document in that group.
   *
   * @param collection
   * @param expr
   * @returns {Array|*}
   */

  function $push(collection, expr) {
    if (isNil(expr)) return collection;
    return collection.map(function (obj) {
      return computeValue(obj, expr);
    });
  }

  /**
   * Returns an array of all the unique values for the selected field among for each document in that group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */

  function $addToSet(collection, expr) {
    return unique($push(collection, expr));
  }

  /**
   * Returns an average of all the values in a group.
   *
   * @param collection
   * @param expr
   * @returns {number}
   */

  function $avg(collection, expr) {
    var data = $push(collection, expr).filter(isNumber);
    var sum = reduce(data, function (acc, n) {
      return acc + n;
    }, 0);
    return sum / (data.length || 1);
  }

  /**
   * Returns the first value in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */

  function $first(collection, expr) {
    return collection.length > 0 ? computeValue(collection[0], expr) : undefined;
  }

  /**
   * Returns the last value in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */

  function $last(collection, expr) {
    return collection.length > 0 ? computeValue(collection[collection.length - 1], expr) : undefined;
  }

  /**
   * Returns the highest value in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */

  function $max(collection, expr) {
    return reduce($push(collection, expr), function (acc, n) {
      return isNil(acc) || n > acc ? n : acc;
    }, undefined);
  }

  /**
   * Combines multiple documents into a single document.
   *
   * @param collection
   * @param expr
   * @returns {Array|*}
   */

  function $mergeObjects$1(collection, expr) {
    return reduce(collection, function (memo, o) {
      return Object.assign(memo, computeValue(o, expr));
    }, {});
  }

  /**
   * Returns the lowest value in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */

  function $min(collection, expr) {
    return reduce($push(collection, expr), function (acc, n) {
      return isNil(acc) || n < acc ? n : acc;
    }, undefined);
  }

  /**
   * Returns the population standard deviation of the input values.
   *
   * @param  {Array} collection
   * @param  {Object} expr
   * @return {Number}
   */

  function $stdDevPop(collection, expr) {
    return stddev($push(collection, expr).filter(isNumber), false);
  }

  /**
   * Returns the sample standard deviation of the input values.
   * @param  {Array} collection
   * @param  {Object} expr
   * @return {Number|null}
   */

  function $stdDevSamp(collection, expr) {
    return stddev($push(collection, expr).filter(isNumber), true);
  }

  /**
   * Returns the sum of all the values in a group.
   *
   * @param collection
   * @param expr
   * @returns {*}
   */

  function $sum(collection, expr) {
    if (!isArray(collection)) return 0; // take a short cut if expr is number literal

    if (isNumber(expr)) return collection.length * expr;
    return reduce($push(collection, expr).filter(isNumber), function (acc, n) {
      return acc + n;
    }, 0);
  }

  /**
   * Group stage Accumulator Operators. https://docs.mongodb.com/manual/reference/operator/aggregation-
   */

  var groupOperators = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $addToSet: $addToSet,
    $avg: $avg,
    $first: $first,
    $last: $last,
    $max: $max,
    $mergeObjects: $mergeObjects$1,
    $min: $min,
    $push: $push,
    $stdDevPop: $stdDevPop,
    $stdDevSamp: $stdDevSamp,
    $sum: $sum
  });

  /**
   * Adds new fields to documents.
   * Outputs documents that contain all existing fields from the input documents and newly added fields.
   *
   * @param {Array} collection
   * @param {*} expr
   * @param {Object} opt Pipeline options
   */

  function $addFields(collection, expr, opt) {
    var newFields = keys(expr);
    if (newFields.length === 0) return collection;
    return collection.map(function (obj) {
      var newObj = cloneDeep(obj);
      each(newFields, function (field) {
        var newValue = computeValue(obj, expr[field]);
        setValue(newObj, field, newValue);
      });
      return newObj;
    });
  }
  /**
   * Alias for $addFields.
   */

  var $set = $addFields;

  /**
   * Categorizes incoming documents into groups, called buckets, based on a specified expression and bucket boundaries.
   * https://docs.mongodb.com/manual/reference/operator/aggregation/bucket/
   *
   * @param {*} collection
   * @param {*} expr
   * @param {Object} opt Pipeline options
   */

  function $bucket(collection, expr, opt) {
    var boundaries = expr.boundaries;
    var defaultKey = expr['default'];
    var lower = boundaries[0]; // inclusive

    var upper = boundaries[boundaries.length - 1]; // exclusive

    var outputExpr = expr.output || {
      'count': {
        '$sum': 1
      }
    };
    assert(boundaries.length > 2, "$bucket 'boundaries' expression must have at least 3 elements");
    var boundType = getType(lower);

    for (var i = 0, len = boundaries.length - 1; i < len; i++) {
      assert(boundType === getType(boundaries[i + 1]), "$bucket 'boundaries' must all be of the same type");
      assert(boundaries[i] < boundaries[i + 1], "$bucket 'boundaries' must be sorted in ascending order");
    }

    !isNil(defaultKey) && getType(expr["default"]) === getType(lower) && assert(lower > expr["default"] || upper < expr["default"], "$bucket 'default' expression must be out of boundaries range");
    var grouped = {};
    each(boundaries, function (k) {
      return grouped[k] = [];
    }); // add default key if provided

    if (!isNil(defaultKey)) grouped[defaultKey] = [];
    var iterator = false;
    return Lazy(function () {
      if (!iterator) {
        collection.each(function (obj) {
          var key = computeValue(obj, expr.groupBy);

          if (isNil(key) || key < lower || key >= upper) {
            assert(!isNil(defaultKey), '$bucket require a default for out of range values');
            grouped[defaultKey].push(obj);
          } else {
            assert(key >= lower && key < upper, "$bucket 'groupBy' expression must resolve to a value in range of boundaries");
            var index = findInsertIndex(boundaries, key);
            var boundKey = boundaries[Math.max(0, index - 1)];
            grouped[boundKey].push(obj);
          }
        }); // upper bound is exclusive so we remove it

        boundaries.pop();
        if (!isNil(defaultKey)) boundaries.push(defaultKey);
        iterator = Lazy(boundaries).map(function (key) {
          var acc = accumulate(grouped[key], null, outputExpr);
          return Object.assign(acc, {
            '_id': key
          });
        });
      }

      return iterator.next();
    });
  }

  /**
   * Categorizes incoming documents into a specific number of groups, called buckets,
   * based on a specified expression. Bucket boundaries are automatically determined
   * in an attempt to evenly distribute the documents into the specified number of buckets.
   * https://docs.mongodb.com/manual/reference/operator/aggregation/bucketAuto/
   *
   * @param {*} collection
   * @param {*} expr
   * @param {*} opt Pipeline options
   */

  function $bucketAuto(collection, expr, opt) {
    var outputExpr = expr.output || {
      'count': {
        '$sum': 1
      }
    };
    var groupByExpr = expr.groupBy;
    var bucketCount = expr.buckets;
    assert(bucketCount > 0, "The $bucketAuto 'buckets' field must be greater than 0, but found: " + bucketCount);
    return collection.transform(function (coll) {
      var approxBucketSize = Math.max(1, Math.round(coll.length / bucketCount));
      var computeValueOptimized = memoize(computeValue);
      var grouped = {};
      var remaining = [];
      var sorted = sortBy(coll, function (o) {
        var key = computeValueOptimized(o, groupByExpr);

        if (isNil(key)) {
          remaining.push(o);
        } else {
          grouped[key] || (grouped[key] = []);
          grouped[key].push(o);
        }

        return key;
      });
      var ID_KEY = idKey();
      var result = [];
      var index = 0; // counter for sorted collection

      for (var i = 0, len = sorted.length; i < bucketCount && index < len; i++) {
        var boundaries = {};
        var bucketItems = [];

        for (var j = 0; j < approxBucketSize && index < len; j++) {
          var key = computeValueOptimized(sorted[index], groupByExpr);
          if (isNil(key)) key = null; // populate current bucket with all values for current key

          into(bucketItems, isNil(key) ? remaining : grouped[key]); // increase sort index by number of items added

          index += isNil(key) ? remaining.length : grouped[key].length; // set the min key boundary if not already present

          if (!has(boundaries, 'min')) boundaries.min = key;

          if (result.length > 0) {
            var lastBucket = result[result.length - 1];
            lastBucket[ID_KEY].max = boundaries.min;
          }
        } // if is last bucket add remaining items


        if (i == bucketCount - 1) {
          into(bucketItems, sorted.slice(index));
        }

        result.push(Object.assign(accumulate(bucketItems, null, outputExpr), {
          '_id': boundaries
        }));
      }

      if (result.length > 0) {
        result[result.length - 1][ID_KEY].max = computeValueOptimized(sorted[sorted.length - 1], groupByExpr);
      }

      return result;
    });
  }

  /**
   * Returns a document that contains a count of the number of documents input to the stage.
   *
   * @param  {Array} collection
   * @param  {String} expr
   * @param {Object} opt Pipeline options
   * @return {Object}
   */

  function $count(collection, expr, opt) {
    assert(isString(expr) && expr.trim() !== '' && expr.indexOf('.') === -1 && expr.trim()[0] !== '$', 'Invalid expression value for $count');
    return Lazy(function () {
      var o = {};
      o[expr] = collection.size();
      return {
        value: o,
        done: false
      };
    }).first();
  }

  /**
   * Processes multiple aggregation pipelines within a single stage on the same set of input documents.
   * Enables the creation of multi-faceted aggregations capable of characterizing data across multiple dimensions, or facets, in a single stage.
   */

  function $facet(collection, expr, opt) {
    return collection.transform(function (array) {
      return [objectMap(expr, function (pipeline) {
        return aggregate(array, pipeline);
      })];
    });
  }

  /**
   * Groups documents together for the purpose of calculating aggregate values based on a collection of documents.
   *
   * @param collection
   * @param expr
   * @param opt Pipeline options
   * @returns {Array}
   */

  function $group(collection, expr, opt) {
    // lookup key for grouping
    var ID_KEY = idKey();
    var id = expr[ID_KEY];
    return collection.transform(function (coll) {
      var partitions = groupBy(coll, function (obj) {
        return computeValue(obj, id, id);
      }); // remove the group key

      expr = clone(expr);
      delete expr[ID_KEY];
      var i = -1;
      var size = partitions.keys.length;
      return function () {
        if (++i === size) return {
          done: true
        };
        var value = partitions.keys[i];
        var obj = {}; // exclude undefined key value

        if (value !== undefined) {
          obj[ID_KEY] = value;
        } // compute remaining keys in expression


        each(expr, function (val, key) {
          obj[key] = accumulate(partitions.groups[i], key, val);
        });
        return {
          value: obj,
          done: false
        };
      };
    });
  }

  /**
   * Restricts the number of documents in an aggregation pipeline.
   *
   * @param collection
   * @param value
   * @param opt
   * @returns {Object|*}
   */
  function $limit(collection, value, opt) {
    return collection.take(value);
  }

  /**
   * Performs a left outer join to another collection in the same database to filter in documents from the “joined” collection for processing.
   *
   * @param collection
   * @param expr
   * @param opt
   */

  function $lookup(collection, expr, opt) {
    var joinColl = expr.from;
    var localField = expr.localField;
    var foreignField = expr.foreignField;
    var asField = expr.as;
    assert(isArray(joinColl) && isString(foreignField) && isString(localField) && isString(asField), '$lookup: invalid argument');
    var hash = {};
    each(joinColl, function (obj) {
      var k = hashCode(resolve(obj, foreignField));
      hash[k] = hash[k] || [];
      hash[k].push(obj);
    });
    return collection.map(function (obj) {
      var k = hashCode(resolve(obj, localField));
      var newObj = clone(obj);
      newObj[asField] = hash[k] || [];
      return newObj;
    });
  }

  /**
   * Filters the document stream, and only allows matching documents to pass into the next pipeline stage.
   * $match uses standard MongoDB queries.
   *
   * @param collection
   * @param expr
   * @param opt
   * @returns {Array|*}
   */

  function $match(collection, expr, opt) {
    var q = new Query(expr);
    return collection.filter(function (o) {
      return q.test(o);
    });
  }

  /**
   * Takes the documents returned by the aggregation pipeline and writes them to a specified collection.
   *
   * Unlike the $out operator in MongoDB, this operator can appear in any position in the pipeline and is
   * useful for collecting intermediate results of an aggregation operation.
   *
   * @param collection
   * @param expr
   * @param opt
   * @returns {*}
   */

  function $out(collection, expr, opt) {
    assert(isArray(expr), '$out expression must be an array');
    return collection.map(function (o) {
      expr.push(o);
      return o; // passthrough
    });
  }

  /**
   * Reshapes a document stream.
   * $project can rename, add, or remove fields as well as create computed values and sub-documents.
   *
   * @param collection
   * @param expr
   * @param opt
   * @returns {Array}
   */

  function $project(collection, expr, opt) {
    if (isEmpty(expr)) return collection; // result collection

    var expressionKeys = keys(expr);
    var idOnlyExcludedExpression = false;
    var ID_KEY = idKey(); // validate inclusion and exclusion

    validateExpression(expr);

    if (inArray(expressionKeys, ID_KEY)) {
      var id = expr[ID_KEY];

      if (id === 0 || id === false) {
        expressionKeys = expressionKeys.filter(notInArray.bind(null, [ID_KEY]));
        assert(notInArray(expressionKeys, ID_KEY), 'Must not contain collections id key');
        idOnlyExcludedExpression = isEmpty(expressionKeys);
      }
    } else {
      // if not specified the add the ID field
      expressionKeys.push(ID_KEY);
    }

    return collection.map(function (obj) {
      return processObject(obj, expr, expressionKeys, idOnlyExcludedExpression);
    });
  }
  /**
   * Process the expression value for $project operators
   *
   * @param {Object} obj The object to use as context
   * @param {Object} expr The experssion object of $project operator
   * @param {Array} expressionKeys The key in the 'expr' object
   * @param {Boolean} idOnlyExcludedExpression Boolean value indicating whether only the ID key is excluded
   */

  function processObject(obj, expr, expressionKeys, idOnlyExcludedExpression) {
    var ID_KEY = idKey();
    var newObj = {};
    var foundSlice = false;
    var foundExclusion = false;
    var dropKeys = [];

    if (idOnlyExcludedExpression) {
      dropKeys.push(ID_KEY);
    }

    expressionKeys.forEach(function (key) {
      // final computed value of the key
      var value; // expression to associate with key

      var subExpr = expr[key];

      if (key !== ID_KEY && inArray([0, false], subExpr)) {
        foundExclusion = true;
      }

      if (key === ID_KEY && isEmpty(subExpr)) {
        // tiny optimization here to skip over id
        value = obj[key];
      } else if (isString(subExpr)) {
        value = computeValue(obj, subExpr, key);
      } else if (inArray([1, true], subExpr)) ; else if (isArray(subExpr)) {
        value = subExpr.map(function (v) {
          var r = computeValue(obj, v);
          if (isNil(r)) return null;
          return r;
        });
      } else if (isObject(subExpr)) {
        var subExprKeys = keys(subExpr);
        var operator = subExprKeys.length > 1 ? false : subExprKeys[0];

        if (inArray(ops(OP_PROJECTION), operator)) {
          var projectionOperators = OPERATORS[OP_PROJECTION]; // apply the projection operator on the operator expression for the key

          if (operator === '$slice') {
            // $slice is handled differently for aggregation and projection operations
            if (ensureArray(subExpr[operator]).every(isNumber)) {
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
          if (has(obj, key)) {
            validateExpression(subExpr);
            var nestedObj = obj[key];
            value = isArray(nestedObj) ? nestedObj.map(function (o) {
              return processObject(o, subExpr, subExprKeys, false);
            }) : processObject(nestedObj, subExpr, subExprKeys, false);
          } else {
            value = computeValue(obj, subExpr, key);
          }
        }
      } else {
        dropKeys.push(key);
        return;
      } // get value with object graph


      var objPathValue = resolveObj(obj, key, {
        preserveMissingValues: true
      }); // add the value at the path

      if (objPathValue !== undefined) {
        merge(newObj, objPathValue, {
          flatten: true
        });
      } // if computed add/or remove accordingly


      if (notInArray([0, 1, false, true], subExpr)) {
        if (value === undefined) {
          removeValue(newObj, key);
        } else {
          setValue(newObj, key, value);
        }
      }
    }); // filter out all missing values preserved to support correct merging

    filterMissing(newObj); // if projection included $slice operator
    // Also if exclusion fields are found or we want to exclude only the id field
    // include keys that were not explicitly excluded

    if (foundSlice || foundExclusion || idOnlyExcludedExpression) {
      newObj = Object.assign({}, obj, newObj);

      if (dropKeys.length > 0) {
        newObj = cloneDeep(newObj);
        each(dropKeys, function (k) {
          return removeValue(newObj, k);
        });
      }
    }

    return newObj;
  }
  /**
   * Validate inclusion and exclusion values in expression
   *
   * @param {Object} expr The expression given for the projection
   */


  function validateExpression(expr) {
    var ID_KEY = idKey();
    var check = [false, false];
    each(expr, function (v, k) {
      if (k === ID_KEY) return;

      if (v === 0 || v === false) {
        check[0] = true;
      } else if (v === 1 || v === true) {
        check[1] = true;
      }

      assert(!(check[0] && check[1]), 'Projection cannot have a mix of inclusion and exclusion.');
    });
  }

  /**
   * Restricts the contents of the documents based on information stored in the documents themselves.
   *
   * https://docs.mongodb.com/manual/reference/operator/aggregation/redact/
   */

  function $redact(collection, expr, opt) {
    return collection.map(function (obj) {
      return redactObj(cloneDeep(obj), expr);
    });
  }

  /**
   * Replaces a document with the specified embedded document or new one.
   * The replacement document can be any valid expression that resolves to a document.
   *
   * https://docs.mongodb.com/manual/reference/operator/aggregation/replaceRoot/
   *
   * @param  {Array} collection
   * @param  {Object} expr
   * @param  {Object} opt
   * @return {*}
   */

  function $replaceRoot(collection, expr, opt) {
    return collection.map(function (obj) {
      obj = computeValue(obj, expr.newRoot);
      assert(isObject(obj), '$replaceRoot expression must return an object');
      return obj;
    });
  }

  /**
   * Randomly selects the specified number of documents from its input.
   * https://docs.mongodb.com/manual/reference/operator/aggregation/sample/
   *
   * @param  {Array} collection
   * @param  {Object} expr
   * @param  {Object} opt
   * @return {*}
   */

  function $sample(collection, expr, opt) {
    var size = expr.size;
    assert(isNumber(size), '$sample size must be a positive integer');
    return collection.transform(function (xs) {
      var len = xs.length;
      var i = -1;
      return function () {
        if (++i === size) return {
          done: true
        };
        var n = Math.floor(Math.random() * len);
        return {
          value: xs[n],
          done: false
        };
      };
    });
  }

  /**
   * Skips over a specified number of documents from the pipeline and returns the rest.
   *
   * @param collection
   * @param value
   * @param  {Object} opt
   * @returns {*}
   */
  function $skip(collection, value, opt) {
    return collection.drop(value);
  }

  /**
   * Takes all input documents and returns them in a stream of sorted documents.
   *
   * @param collection
   * @param sortKeys
   * @param  {Object} opt
   * @returns {*}
   */

  function $sort(collection, sortKeys, opt) {
    if (isEmpty(sortKeys) || !isObject(sortKeys)) return collection;
    opt = opt || {};
    var cmp = compare;
    var collationSpec = opt['collation']; // use collation comparator if provided

    if (isObject(collationSpec) && isString(collationSpec.locale)) {
      cmp = collationComparator(collationSpec);
    }

    return collection.transform(function (coll) {
      var modifiers = keys(sortKeys);
      each(modifiers.reverse(), function (key) {
        var grouped = groupBy(coll, function (obj) {
          return resolve(obj, key);
        });
        var sortedIndex = {};
        var indexKeys = sortBy(grouped.keys, function (k, i) {
          sortedIndex[k] = i;
          return k;
        }, cmp);
        if (sortKeys[key] === -1) indexKeys.reverse();
        coll = [];
        each(indexKeys, function (k) {
          return into(coll, grouped.groups[sortedIndex[k]]);
        });
      });
      return coll;
    });
  } // MongoDB collation strength to JS localeCompare sensitivity mapping.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare

  var COLLATION_STRENGTH = {
    // Only strings that differ in base letters compare as unequal. Examples: a ≠ b, a = á, a = A.
    1: 'base',
    //  Only strings that differ in base letters or accents and other diacritic marks compare as unequal.
    // Examples: a ≠ b, a ≠ á, a = A.
    2: 'accent',
    // Strings that differ in base letters, accents and other diacritic marks, or case compare as unequal.
    // Other differences may also be taken into consideration. Examples: a ≠ b, a ≠ á, a ≠ A
    3: 'variant' // case - Only strings that differ in base letters or case compare as unequal. Examples: a ≠ b, a = á, a ≠ A.

  };
  /**
   * Creates a comparator function for the given collation spec. See https://docs.mongodb.com/manual/reference/collation/
   *
   * @param spec {Object} The MongoDB collation spec.
   * {
   *   locale: <string>,
   *   caseLevel: <boolean>,
   *   caseFirst: <string>,
   *   strength: <int>,
   *   numericOrdering: <boolean>,
   *   alternate: <string>,
   *   maxVariable: <string>, // unsupported
   *   backwards: <boolean> // unsupported
   * }
   */

  function collationComparator(spec) {
    var localeOpt = {
      sensitivity: COLLATION_STRENGTH[spec.strength || 3],
      caseFirst: spec.caseFirst === 'off' ? 'false' : spec.caseFirst || 'false',
      numeric: spec.numericOrdering || false,
      ignorePunctuation: spec.alternate === 'shifted'
    }; // when caseLevel is true for strength  1:base and 2:accent, bump sensitivity to the nearest that supports case comparison

    if ((spec.caseLevel || false) === true) {
      if (localeOpt.sensitivity === 'base') localeOpt.sensitivity = 'case';
      if (localeOpt.sensitivity === 'accent') localeOpt.sensitivity = 'variant';
    }

    var collator = new Intl.Collator(spec.locale, localeOpt);
    return function (a, b) {
      // non strings
      if (!isString(a) || !isString(b)) return compare(a, b); // only for strings

      var i = collator.compare(a, b);
      if (i < 0) return -1;
      if (i > 0) return 1;
      return 0;
    };
  }

  /**
   * Groups incoming documents based on the value of a specified expression,
   * then computes the count of documents in each distinct group.
   *
   * https://docs.mongodb.com/manual/reference/operator/aggregation/sortByCount/
   *
   * @param  {Array} collection
   * @param  {Object} expr
   * @param  {Object} opt
   * @return {*}
   */

  function $sortByCount(collection, expr, opt) {
    var newExpr = {
      count: {
        $sum: 1
      }
    };
    newExpr[idKey()] = expr;
    return $sort($group(collection, newExpr), {
      count: -1
    }, opt);
  }

  /**
   * Takes an array of documents and returns them as a stream of documents.
   *
   * @param collection
   * @param expr
   * @param  {Object} opt
   * @returns {Array}
   */

  function $unwind(collection, expr, opt) {
    if (isString(expr)) {
      expr = {
        path: expr
      };
    }

    var field = expr.path.substr(1);
    var includeArrayIndex = expr.includeArrayIndex || false;
    var preserveNullAndEmptyArrays = expr.preserveNullAndEmptyArrays || false;

    var format = function format(o, i) {
      if (includeArrayIndex !== false) o[includeArrayIndex] = i;
      return o;
    };

    var value;
    return Lazy(function () {
      var _loop = function _loop() {
        // take from lazy sequence if available
        if (Lazy.isIterator(value)) {
          var tmp = value.next();
          if (!tmp.done) return {
            v: tmp
          };
        } // fetch next object


        var obj = collection.next();
        if (obj.done) return {
          v: obj
        }; // unwrap value

        obj = obj.value; // get the value of the field to unwind

        value = resolve(obj, field); // throw error if value is not an array???

        if (isArray(value)) {
          if (value.length === 0 && preserveNullAndEmptyArrays === true) {
            value = null; // reset unwind value

            var _tmp = cloneDeep(obj);

            removeValue(_tmp, field);
            return {
              v: {
                value: format(_tmp, null),
                done: false
              }
            };
          } else {
            // construct a lazy sequence for elements per value
            value = Lazy(value).map(function (item, i) {
              var tmp = cloneDeep(obj);
              setValue(tmp, field, item);
              return format(tmp, i);
            });
          }
        } else if (!isEmpty(value) || preserveNullAndEmptyArrays === true) {
          var _tmp2 = cloneDeep(obj);

          return {
            v: {
              value: format(_tmp2, null),
              done: false
            }
          };
        }
      };

      while (true) {
        var _ret = _loop();

        if (_typeof(_ret) === "object") return _ret.v;
      }
    });
  }

  /**
   * Pipeline Aggregation Stages. https://docs.mongodb.com/manual/reference/operator/aggregation-
   */

  var pipelineOperators = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $addFields: $addFields,
    $set: $set,
    $bucket: $bucket,
    $bucketAuto: $bucketAuto,
    $count: $count,
    $facet: $facet,
    $group: $group,
    $limit: $limit,
    $lookup: $lookup,
    $match: $match,
    $out: $out,
    $project: $project,
    $redact: $redact,
    $replaceRoot: $replaceRoot,
    $sample: $sample,
    $skip: $skip,
    $sort: $sort,
    $sortByCount: $sortByCount,
    $unwind: $unwind
  });

  /**
   * Projection Operators. https://docs.mongodb.com/manual/reference/operator/projection/
   */
  /**
   * Projects the first element in an array that matches the query condition.
   *
   * @param obj
   * @param field
   * @param expr
   */

  function $(obj, expr, field) {
    err('$ not implemented');
  }
  /**
   * Projects only the first element from an array that matches the specified $elemMatch condition.
   *
   * @param obj
   * @param field
   * @param expr
   * @returns {*}
   */

  function $elemMatch$1(obj, expr, field) {
    var arr = resolve(obj, field);
    var query = new Query(expr);
    assert(isArray(arr), '$elemMatch: invalid argument');

    for (var i = 0; i < arr.length; i++) {
      if (query.test(arr[i])) return [arr[i]];
    }

    return undefined;
  }
  /**
   * Limits the number of elements projected from an array. Supports skip and limit slices.
   *
   * @param obj
   * @param field
   * @param expr
   */

  function $slice$1(obj, expr, field) {
    var xs = resolve(obj, field);
    if (!isArray(xs)) return xs;

    if (isArray(expr)) {
      return slice(xs, expr[0], expr[1]);
    } else {
      assert(isNumber(expr), '$slice: invalid arguments for projection');
      return slice(xs, expr);
    }
  }

  var projectionOperators = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $: $,
    $elemMatch: $elemMatch$1,
    $slice: $slice$1
  });

  // Query and Projection Operators. https://docs.mongodb.com/manual/reference/operator/query/

  function createQueryOperator(pred) {
    return function (selector, value) {
      return function (obj) {
        // value of field must be fully resolved.
        var lhs = resolve(obj, selector, {
          meta: true
        });
        lhs = unwrap(lhs.result, lhs.depth);
        return pred(lhs, value);
      };
    };
  }

  var $all$1 = createQueryOperator($all);
  var $elemMatch$2 = createQueryOperator($elemMatch);
  var $eq$2 = createQueryOperator($eq);
  var $exists$1 = createQueryOperator($exists);
  var $gt$2 = createQueryOperator($gt);
  var $gte$2 = createQueryOperator($gte);
  var $in$2 = createQueryOperator($in$1);
  var $lt$2 = createQueryOperator($lt);
  var $lte$2 = createQueryOperator($lte);
  var $mod$2 = createQueryOperator($mod$1);
  var $ne$2 = createQueryOperator($ne);
  var $nin$2 = createQueryOperator($nin);
  var $regex$1 = createQueryOperator($regex);
  var $size$2 = createQueryOperator($size$1);
  var $type$1 = createQueryOperator($type);
  /**
   * Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
   *
   * @param selector
   * @param value
   * @returns {Function}
   */

  function $and$1(selector, value) {
    assert(isArray(value), 'Invalid expression: $and expects value to be an Array');
    var queries = [];
    each(value, function (expr) {
      return queries.push(new Query(expr));
    });
    return function (obj) {
      for (var i = 0; i < queries.length; i++) {
        if (!queries[i].test(obj)) {
          return false;
        }
      }

      return true;
    };
  }
  /**
   * Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
   *
   * @param selector
   * @param value
   * @returns {Function}
   */

  function $or$1(selector, value) {
    assert(isArray(value), 'Invalid expression. $or expects value to be an Array');
    var queries = [];
    each(value, function (expr) {
      return queries.push(new Query(expr));
    });
    return function (obj) {
      for (var i = 0; i < queries.length; i++) {
        if (queries[i].test(obj)) {
          return true;
        }
      }

      return false;
    };
  }
  /**
   * Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
   *
   * @param selector
   * @param value
   * @returns {Function}
   */

  function $nor(selector, value) {
    assert(isArray(value), 'Invalid expression. $nor expects value to be an Array');
    var f = $or$1('$or', value);
    return function (obj) {
      return !f(obj);
    };
  }
  /**
   * Inverts the effect of a query expression and returns documents that do not match the query expression.
   *
   * @param selector
   * @param value
   * @returns {Function}
   */

  function $not$1(selector, value) {
    var criteria = {};
    criteria[selector] = normalize(value);
    var query = new Query(criteria);
    return function (obj) {
      return !query.test(obj);
    };
  }
  /**
   * Matches documents that satisfy a JavaScript expression.
   *
   * @param selector
   * @param value
   * @returns {Function}
   */

  function $where(selector, value) {
    if (!isFunction(value)) {
      value = new Function('return ' + value + ';');
    }

    return function (obj) {
      return value.call(obj) === true;
    };
  }
  /**
   * Allows the use of aggregation expressions within the query language.
   *
   * @param selector
   * @param value
   * @returns {Function}
   */

  function $expr(selector, value) {
    return function (obj) {
      return computeValue(obj, value);
    };
  }

  var queryOperators = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $all: $all$1,
    $elemMatch: $elemMatch$2,
    $eq: $eq$2,
    $exists: $exists$1,
    $gt: $gt$2,
    $gte: $gte$2,
    $in: $in$2,
    $lt: $lt$2,
    $lte: $lte$2,
    $mod: $mod$2,
    $ne: $ne$2,
    $nin: $nin$2,
    $regex: $regex$1,
    $size: $size$2,
    $type: $type$1,
    $and: $and$1,
    $or: $or$1,
    $nor: $nor,
    $not: $not$1,
    $where: $where,
    $expr: $expr
  });

  var OPERATORS = {};
  OPERATORS[OP_EXPRESSION] = {};
  OPERATORS[OP_GROUP] = {};
  OPERATORS[OP_PIPELINE] = {};
  OPERATORS[OP_PROJECTION] = {};
  OPERATORS[OP_QUERY] = {};
  var SYSTEM_OPERATORS = [[OP_EXPRESSION, expressionOperators], [OP_GROUP, groupOperators], [OP_PIPELINE, pipelineOperators], [OP_PROJECTION, projectionOperators], [OP_QUERY, queryOperators]];
  /**
   * Enables the default operators of the system
   */

  function enableSystemOperators() {
    each(SYSTEM_OPERATORS, function (arr) {
      var _arr = _slicedToArray(arr, 2),
          cls = _arr[0],
          values = _arr[1];

      Object.assign(OPERATORS[cls], values);
    });
  }
  /**
   * Add new operators
   *
   * @param opClass the operator class to extend
   * @param fn a function returning an object of new operators
   */

  function addOperators(opClass, fn) {
    var newOperators = fn(_internal()); // ensure correct type specified

    assert(has(OPERATORS, opClass), "Invalid operator class ".concat(opClass));
    var operators = OPERATORS[opClass]; // check for existing operators

    each(newOperators, function (_, op) {
      assert(/^\$[a-zA-Z0-9_]*$/.test(op), "Invalid operator name ".concat(op));
      assert(!has(operators, op), "".concat(op, " already exists for '").concat(opClass, "' operators"));
    });
    var wrapped = {};

    switch (opClass) {
      case OP_QUERY:
        each(newOperators, function (fn, op) {
          fn = fn.bind(newOperators);

          wrapped[op] = function (selector, value) {
            return function (obj) {
              // value of field must be fully resolved.
              var lhs = resolve(obj, selector);
              var result = fn(selector, lhs, value);
              assert(isBoolean(result), "".concat(op, " must return a boolean"));
              return result;
            };
          };
        });
        break;

      case OP_PROJECTION:
        each(newOperators, function (fn, op) {
          fn = fn.bind(newOperators);

          wrapped[op] = function (obj, expr, selector) {
            var lhs = resolve(obj, selector);
            return fn(selector, lhs, expr);
          };
        });
        break;

      default:
        each(newOperators, function (fn, op) {
          wrapped[op] = function () {
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            return fn.apply(newOperators, args);
          };
        });
    } // toss the operator salad :)


    Object.assign(OPERATORS[opClass], wrapped);
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
      return new Query(criteria).find(this.toJSON(), projection);
    },

    /**
     * Runs the given aggregation operators on this collection
     * @params pipeline
     * @returns {Array}
     */
    aggregate: function aggregate(pipeline) {
      return new Aggregator(pipeline).run(this.toJSON());
    }
  };

  enableSystemOperators();
  var VERSION = '2.5.3'; // mingo!

  var index = {
    _internal: _internal,
    Aggregator: Aggregator,
    CollectionMixin: CollectionMixin,
    Cursor: Cursor,
    Lazy: Lazy,
    OP_EXPRESSION: OP_EXPRESSION,
    OP_GROUP: OP_GROUP,
    OP_PIPELINE: OP_PIPELINE,
    OP_PROJECTION: OP_PROJECTION,
    OP_QUERY: OP_QUERY,
    Query: Query,
    VERSION: VERSION,
    addOperators: addOperators,
    aggregate: aggregate,
    find: find,
    remove: remove,
    setup: setup
  };

  return index;

})));
