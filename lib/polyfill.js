
/**
 * Polyfill to add native methods for non-supported environments.
 */

// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_objects/Function/bind
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new Error('Function.prototype.bind - what is trying to be bound is not callable')
    }

    var aArgs = Array.prototype.slice.call(arguments, 1)
    var fToBind = this
    var fNOP = function () {}
    var fBound = function () {
      return fToBind.apply(
        (this instanceof fNOP) ? this : oThis,
        aArgs.concat(Array.prototype.slice.call(arguments))
      )
    }

    if (this.prototype) {
      // Function.prototype doesn't have a prototype property
      fNOP.prototype = this.prototype
    }
    fBound.prototype = new fNOP()

    return fBound
  }
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function(predicate) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined')
      }

      var o = Object(this)
      var len = o.length >>> 0

      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function')
      }

      var thisArg = arguments[1]
      var k = 0

      while (k < len) {
        var kValue = o[k]
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue
        }
        k++
      }
      return undefined
    }
  })
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function(predicate) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined')
      }

      var o = Object(this)
      var len = o.length >>> 0

      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function')
      }

      var thisArg = arguments[1]
      var k = 0
      while (k < len) {
        var kValue = o[k]
        if (predicate.call(thisArg, kValue, k, o)) {
          return k
        }
        k++
      }
      return -1
    }
  })
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined')
      }

      var o = Object(this)
      var len = o.length >>> 0

      if (len === 0) {
        return false
      }
      var n = fromIndex | 0
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0)

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y))
      }

      while (k < len) {
        if (sameValueZero(o[k], searchElement)) {
          return true
        }
        k++
      }
      return false
    }
  })
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign != 'function') {
  Object.assign = function(target, varArgs) { // .length of function is 2

    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }

    var to = Object(target)
    var args = Array.prototype.slice.call(arguments)

    for (var index = 1; index < args.length; index++) {
      var nextSource = args[index]

      if (nextSource != null) { // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (nextSource.hasOwnProperty(nextKey)) {
            to[nextKey] = nextSource[nextKey]
          }
        }
      }
    }
    return to
  }
}

// http://tokenposts.blogspot.co.za/2012/04/javascript-objectkeys-browser.html
if (!Object.keys) {
  Object.keys = function (o) {
    if (o !== Object(o)) {
      throw new TypeError('Object.keys called on a non-object')
    }

    var result = []
    for (var k in o) {
      if (o.hasOwnProperty(k)) {
        result.push(k)
      }
    }
    return result
  }
}

// https://github.com/es-shims/Object.values/blob/master/implementation.js
if (!Object.values) {
  Object.values = function (o) {
    if (o !== Object(o)) {
      throw new TypeError('Object.values called on a non-object')
    }
    var result = []
    for (var k in o) {
      if (o.hasOwnProperty(k)) {
        result.push(o[k])
      }
    }
    return result
  }
}
