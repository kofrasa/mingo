import { OP_AGGREGATE, OP_GROUP, OP_PIPELINE, OP_PROJECTION, OP_QUERY } from '../constants'
import { assert, each, err, has, into, isBoolean, keys, reduce } from '../util'
import { _internal, computeValue, idKey, resolve } from '../internal'
import { Query } from '../query.js'
import { aggregateOperators } from './aggregation/index.js'
import { groupOperators } from './group.js'
import { pipelineOperators } from './pipeline.js'
import { projectionOperators } from './projection.js'
import { queryOperators } from './query.js'

// operator definitions
const OPERATORS = {
  'aggregate': aggregateOperators,
  'group': groupOperators,
  'pipeline': pipelineOperators,
  'projection': projectionOperators,
  'query': queryOperators
}

/**
 * Returns the operators defined for the given operator classes
 */
export function ops () {
  return reduce(arguments, (acc, cls) => into(acc, keys(OPERATORS[cls])), [])
}

/**
 * Add new operators
 *
 * @param opClass the operator class to extend
 * @param fn a function returning an object of new operators
 */
export function addOperators (opClass, fn) {

  const newOperators = fn(_internal())

  // ensure correct type specified
  assert(has(OPERATORS, opClass), `Invalid operator class ${opClass}`)

  let operators = OPERATORS[opClass]

  // check for existing operators
  each(newOperators, (fn, op) => {
    assert(/^\$\w+$/.test(op), `Invalid operator name ${op}`)
    assert(!has(operators, op), `${op} already exists for '${opClass}' operators`)
  })

  let wrapped = {}

  switch (opClass) {
    case OP_QUERY:
      each(newOperators, (fn, op) => {
        wrapped[op] = ((f, ctx) => {
          return (selector, value) => {
            return {
              test: (obj) => {
                // value of field must be fully resolved.
                let lhs = resolve(obj, selector)
                let result = f.call(ctx, selector, lhs, value)
                if (isBoolean(result)) {
                  return result
                } else if (result instanceof Query) {
                  return result.test(obj)
                } else {
                  err("Invalid return type for '" + op + "'. Must return a Boolean or Query")
                }
              }
            }
          }
        })(fn, newOperators)
      })
      break
    case OP_PROJECTION:
      each(newOperators, (fn, op) => {
        wrapped[op] = ((f, ctx) => {
          return (obj, expr, selector) => {
            let lhs = resolve(obj, selector)
            return f.call(ctx, selector, lhs, expr)
          }
        })(fn, newOperators)
      })
      break
    default:
      each(newOperators, (fn, op) => {
        wrapped[op] = ((f, ctx) => {
          return (...args) => {
            return f.apply(ctx, args)
          }
        })(fn, newOperators)
      })
  }

  // toss the operator salad :)
  Object.assign(OPERATORS[opClass], wrapped)
}
