/**
 * Keys specifying different operator classes
 */
var OP_QUERY = Mingo.OP_QUERY = 'query'
var OP_GROUP = Mingo.OP_GROUP = 'group'
var OP_AGGREGATE = Mingo.OP_AGGREGATE = 'aggregate'
var OP_PIPELINE = Mingo.OP_PIPELINE = 'pipeline'
var OP_PROJECTION = Mingo.OP_PROJECTION = 'projection'

// operator definitions
var OPERATORS = {
  'aggregate': aggregateOperators,
  'group': groupOperators,
  'pipeline': pipelineOperators,
  'projection': projectionOperators,
  'query': queryOperators
}

/**
 * Returns the operators defined for the given operator key
 *
 * @param {String} opClass The operator class to query. See `Mingo.OP_$XXX` members
 */
function ops (opClass) {
  return keys(OPERATORS[opClass])
}

/**
 * Add new operators
 *
 * @param opClass the operator class to extend
 * @param fn a function returning an object of new operators
 */
Mingo.addOperators = function (opClass, fn) {

  var newOperators = fn({
    'computeValue': computeValue,
    'key': keyId,
    'ops': ops,
    'resolve': resolve
  })

  // ensure correct type specified
  assert(has(OPERATORS, opClass), "Could not identify operator class '" + opClass + "'")

  var operators = OPERATORS[opClass]

  // check for existing operators
  each(newOperators, function (fn, op) {
    assert(/^\$\w+$/.test(op), "Invalid operator name '" + op + "'")
    assert(!has(operators, op), 'Operator ' + op + ' is already defined for ' + opClass + ' operators')
  })

  var wrapped = {}

  switch (opClass) {
    case OP_QUERY:
      each(newOperators, function (fn, op) {
        wrapped[op] = (function (f, ctx) {
          return function (selector, value) {
            return {
              test: function (obj) {
                // value of field must be fully resolved.
                var lhs = resolve(obj, selector)
                var result = f.call(ctx, selector, lhs, value)
                if (isBoolean(result)) {
                  return result
                } else if (result instanceof Query) {
                  return result.test(obj)
                } else {
                  err("Invalid return type for '" + op + "'. Must return a Boolean or Mingo.Query")
                }
              }
            }
          }
        }(fn, newOperators))
      })
      break
    case OP_PROJECTION:
      each(newOperators, function (fn, op) {
        wrapped[op] = (function (f, ctx) {
          return function (obj, expr, selector) {
            var lhs = resolve(obj, selector)
            return f.call(ctx, selector, lhs, expr)
          }
        }(fn, newOperators))
      })
      break
    default:
      each(newOperators, function (fn, op) {
        wrapped[op] = (function (f, ctx) {
          return function () {
            var args = ArrayProto.slice.call(arguments)
            return f.apply(ctx, args)
          }
        }(fn, newOperators))
      })
  }

  // toss the operator salad :)
  Object.assign(OPERATORS[opClass], wrapped)
}
