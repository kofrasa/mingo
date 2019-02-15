import { OP_PROJECTION, OP_QUERY } from './../constants'
import { assert, each, has, into, isBoolean, keys, reduce } from './../util'
import { _internal, resolve } from './../internal'
import { expressionOperators } from './expression/index.js'
import { groupOperators } from './group/index.js'
import { pipelineOperators } from './pipeline/index.js'
import { projectionOperators } from './projection.js'
import { queryOperators } from './query.js'

// operator definitions
const OPERATORS = {
  'expression': expressionOperators,
  'group': groupOperators,
  'pipeline': pipelineOperators,
  'projection': projectionOperators,
  'query': queryOperators
}

/**
 * Returns the operators defined for the given operator classes
 */
export function ops () {
  // Workaround for browser-compatibility bug: on iPhone 6S Safari (and
  // probably some other platforms), `arguments` isn't detected as an array,
  // but has a length field, so functions like `reduce` and up including the
  // length field in their iteration. Copy to a real array.
  let args = Array.prototype.slice.call(arguments)
  return reduce(args, (acc, cls) => into(acc, keys(OPERATORS[cls])), [])
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
            f = f.bind(ctx)
            return {
              test: (obj) => {
                // value of field must be fully resolved.
                let lhs = resolve(obj, selector)
                let result = f(selector, lhs, value)
                assert(isBoolean(result), `${op} must return a boolean`)
                return result
              }
            }
          }
        })(fn, newOperators)
      })
      break
    case OP_PROJECTION:
      each(newOperators, (fn, op) => {
        wrapped[op] = ((f, ctx) => {
          f = f.bind(ctx)
          return (obj, expr, selector) => {
            let lhs = resolve(obj, selector)
            return f(selector, lhs, expr)
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
